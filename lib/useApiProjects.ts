import { useState, useEffect, useCallback } from 'react';
import { ApiProject, ApiProjectsResponse } from './types';
import { searchApiProjects, getAllApiProjects } from './apiProjects';

interface UseApiProjectsState {
  projects: ApiProject[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  filteredCount: number;
}

interface UseApiProjectsReturn extends UseApiProjectsState {
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (term: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  toggleDocumentFilter: () => void;
  showOnlyWithDocuments: boolean;
}

const CACHE_KEY = 'api_projects_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  projects: ApiProject[];
  timestamp: number;
  totalCount: number;
}

/**
 * Custom hook for managing API projects with caching and pagination
 */
export function useApiProjects(initialPageSize = 50): UseApiProjectsReturn {
  const [state, setState] = useState<UseApiProjectsState>({
    projects: [],
    loading: true,
    error: null,
    totalCount: 0,
    hasMore: true,
    filteredCount: 0,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [showOnlyWithDocuments, setShowOnlyWithDocuments] = useState(true);

  // Load projects from cache
  const loadFromCache = useCallback((): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;
      
      return isExpired ? null : cacheData;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  }, []);

  // Save projects to cache
  const saveToCache = useCallback((projects: ApiProject[], totalCount: number) => {
    try {
      const cacheData: CacheData = {
        projects,
        timestamp: Date.now(),
        totalCount,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async (page = 0, append = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      let response: ApiProjectsResponse;
      
      if (isSearching && searchTerm) {
        const searchResults = await searchApiProjects(searchTerm, pageSize * (page + 1));
        response = {
          data: searchResults,
          totalCount: searchResults.length,
          skip: 0,
          take: searchResults.length,
        };
      } else {
        response = await getAllApiProjects(page, pageSize);
      }

      setState(prev => ({
        ...prev,
        projects: append ? [...prev.projects, ...response.data] : response.data,
        totalCount: response.totalCount,
        hasMore: response.data.length === pageSize && (page + 1) * pageSize < response.totalCount,
        loading: false,
      }));

      // Only cache non-search results
      if (!isSearching) {
        saveToCache(response.data, response.totalCount);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      }));
    }
  }, [pageSize, isSearching, searchTerm, saveToCache]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Try to load from cache first
      const cached = loadFromCache();
      if (cached && !isSearching) {
        setState(prev => ({
          ...prev,
          projects: cached.projects,
          totalCount: cached.totalCount,
          hasMore: cached.projects.length < cached.totalCount,
          loading: false,
        }));
        return;
      }

      // Fetch from API if no cache or searching
      await fetchProjects(0, false);
    };

    loadInitialData();
  }, [fetchProjects, loadFromCache, isSearching]);

  // Refetch projects
  const refetch = useCallback(async () => {
    setCurrentPage(0);
    await fetchProjects(0, false);
  }, [fetchProjects]);

  // Load more projects (pagination)
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchProjects(nextPage, true);
  }, [state.loading, state.hasMore, currentPage, fetchProjects]);

  // Search projects
  const search = useCallback(async (term: string) => {
    setSearchTerm(term);
    setIsSearching(!!term);
    setCurrentPage(0);
    
    // If empty search term, clear search
    if (!term) {
      setIsSearching(false);
      await fetchProjects(0, false);
      return;
    }

    await fetchProjects(0, false);
  }, [fetchProjects]);

  // Clear search
  const clearSearch = useCallback(async () => {
    setSearchTerm('');
    setIsSearching(false);
    setCurrentPage(0);
    await fetchProjects(0, false);
  }, [fetchProjects]);

  // Toggle document filter
  const toggleDocumentFilter = () => {
    setShowOnlyWithDocuments(prev => !prev);
  };

  // Filter projects based on included documents
  const getFilteredProjects = (projects: ApiProject[]) => {
    if (!showOnlyWithDocuments) return projects;
    return projects.filter(project => project.includedDocuments && project.includedDocuments.length > 0);
  };

  // Apply filtering to current projects
  const filteredProjects = getFilteredProjects(state.projects);
  const filteredCount = filteredProjects.length;

  return {
    ...state,
    projects: filteredProjects,
    filteredCount,
    refetch,
    loadMore,
    search,
    clearSearch,
    toggleDocumentFilter,
    showOnlyWithDocuments,
  };
} 