import { ApiProject, ApiProjectsResponse, ApiProjectsParams } from './types';

// Use our Next.js proxy route to avoid CORS issues
const API_BASE_URL = '/api/proxy-itbs';

/**
 * Fetch projects from the HyperWaterBids API via our proxy (No auth required)
 */
export async function fetchApiProjects(params: ApiProjectsParams = {}): Promise<ApiProjectsResponse> {
  const searchParams = new URLSearchParams();
  
  // Add only supported query parameters
  if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params.take !== undefined) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);

  // Use our proxy endpoint
  const url = `${API_BASE_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle the actual API response structure: { entries: [...], total: number, hasMore: boolean }
    return {
      data: data.entries || [],
      totalCount: data.total || 0,
      skip: params.skip || 0,
      take: params.take || 50,
    };
  } catch (error) {
    console.error('Error fetching API projects:', error);
    throw error;
  }
}

/**
 * Search projects by name
 */
export async function searchApiProjects(searchTerm: string, limit = 20): Promise<ApiProject[]> {
  const response = await fetchApiProjects({
    search: searchTerm,
    take: limit,
    // Remove orderBy and orderDirection - API doesn't support them
  });
  
  return response.data;
}

/**
 * Get all projects with pagination
 */
export async function getAllApiProjects(page = 0, pageSize = 50): Promise<ApiProjectsResponse> {
  return fetchApiProjects({
    skip: page * pageSize,
    take: pageSize,
    // Remove orderBy and orderDirection - API doesn't support them
  });
}

/**
 * Get project by ID
 */
export async function getApiProjectById(id: string): Promise<ApiProject | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
} 