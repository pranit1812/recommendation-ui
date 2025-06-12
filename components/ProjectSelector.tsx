'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, RefreshCw, Database, Filter } from 'lucide-react';
import { useProjects } from '@/lib/useProjects';
import { useApiProjects } from '@/lib/useApiProjects';
import { Project as EnhancedProject } from '@/lib/types';

interface ProjectSelectorProps {
  selectedProjects: string[];
  onProjectToggle: (projectId: string) => void;
  maxSelections?: number;
  className?: string;
}

export function ProjectSelector({ 
  selectedProjects, 
  onProjectToggle, 
  maxSelections = 5,
  className = '' 
}: ProjectSelectorProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'manual'>('api');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [newProjectId, setNewProjectId] = useState('');

  // Manual projects hook
  const { projects: manualProjects, addProject, removeProject } = useProjects();
  
  // API projects hook
  const { 
    projects: apiProjects, 
    loading: apiLoading, 
    error: apiError, 
    search: searchApiProjects, 
    clearSearch, 
    refetch,
    toggleDocumentFilter,
    showOnlyWithDocuments,
    totalCount: apiTotalCount,
    filteredCount: apiFilteredCount
  } = useApiProjects();

  // Convert manual projects to Project format
  const manualProjectsList: EnhancedProject[] = manualProjects.map(project => ({
    id: project.id,
    name: project.name,
    source: 'manual' as const,
    createdAt: new Date(),
  }));

  // Convert API projects to Project format
  const apiProjectsList: EnhancedProject[] = apiProjects.map(project => ({
    id: project.id,
    name: project.projectName,
    source: 'api' as const,
    documentCount: project.includedDocuments?.length || 0,
    createdAt: project.createdAt ? new Date(project.createdAt) : undefined,
  }));

  // Combined and filtered projects based on active tab
  const getFilteredProjects = (): EnhancedProject[] => {
    const projects = activeTab === 'api' ? apiProjectsList : manualProjectsList;
    
    if (!searchTerm) return projects;
    
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (activeTab === 'api') {
      await searchApiProjects(term);
    }
  };

  // Clear search
  const handleClearSearch = async () => {
    setSearchTerm('');
    if (activeTab === 'api') {
      await clearSearch();
    }
  };

  // Add manual project
  const handleAddManualProject = () => {
    if (newProjectId.trim()) {
      addProject(newProjectId.trim(), `Project ${newProjectId.trim()}`);
      setNewProjectId('');
      setShowAddManual(false);
    }
  };

  // Remove manual project
  const handleRemoveManualProject = (projectId: string) => {
    removeProject(projectId);
    // Also deselect if currently selected
    if (selectedProjects.includes(projectId)) {
      onProjectToggle(projectId);
    }
  };

  const filteredProjects = getFilteredProjects();
  const canSelectMore = selectedProjects.length < maxSelections;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Project Selection
        </CardTitle>
        <CardDescription>
          Choose up to {maxSelections} projects to chat with
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Selection */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>API Projects</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {apiFilteredCount}
              {showOnlyWithDocuments && apiTotalCount > apiFilteredCount && (
                <span className="text-muted-foreground">/{apiTotalCount}</span>
              )}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Manual Projects</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {manualProjectsList.length}
            </Badge>
          </button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab} projects...`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={handleClearSearch} className="text-xs">
                Clear
              </Button>
            )}
            {activeTab === 'api' && (
              <>
                <Button 
                  variant={showOnlyWithDocuments ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleDocumentFilter} 
                  className="text-xs gap-1"
                  title={showOnlyWithDocuments ? "Showing projects with documents only" : "Showing all projects"}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {showOnlyWithDocuments ? "With Docs" : "All"}
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={refetch} disabled={apiLoading} className="text-xs">
                  <RefreshCw className={`h-4 w-4 ${apiLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-1">Refresh</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Manual Project Add Section */}
        {activeTab === 'manual' && (
          <div className="space-y-2">
            {!showAddManual ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddManual(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Project
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter project ID..."
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualProject()}
                />
                <Button size="sm" onClick={handleAddManualProject}>
                  Add
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddManual(false);
                    setNewProjectId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {activeTab === 'api' && apiLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading API projects...</span>
            </div>
            {/* Loading Skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {activeTab === 'api' && apiError && !apiLoading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="text-destructive text-sm font-medium">
                Failed to load API projects
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {apiError}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={apiLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${apiLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab('manual')}
                className="text-xs"
              >
                Use Manual Projects
              </Button>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!apiLoading && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No projects found</p>
                {activeTab === 'api' && showOnlyWithDocuments && apiTotalCount > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs">No projects have documents uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleDocumentFilter}
                      className="text-xs gap-1"
                    >
                      <Filter className="h-3 w-3" />
                      Show all {apiTotalCount} projects
                    </Button>
                  </div>
                ) : searchTerm ? (
                  <p className="text-xs">Try adjusting your search term</p>
                ) : activeTab === 'api' ? (
                  <p className="text-xs">No API projects available</p>
                ) : (
                  <p className="text-xs">No manual projects added yet</p>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isSelected = selectedProjects.includes(project.id);
                const canSelect = !isSelected && canSelectMore;
                
                return (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{project.name}</p>
                        <Badge variant={project.source === 'api' ? 'default' : 'secondary'}>
                          {project.source}
                        </Badge>
                        {project.documentCount !== undefined && (
                          <Badge variant="outline">
                            {project.documentCount} docs
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {project.id}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {project.source === 'manual' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveManualProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onProjectToggle(project.id)}
                        disabled={!canSelect && !isSelected}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Selection Summary */}
        {selectedProjects.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Selected Projects ({selectedProjects.length}/{maxSelections}):
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedProjects.map((projectId) => {
                const project = [...apiProjectsList, ...manualProjectsList].find(p => p.id === projectId);
                return (
                  <Badge
                    key={projectId}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => onProjectToggle(projectId)}
                  >
                    {project?.name || projectId} ×
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 