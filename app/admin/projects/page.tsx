'use client';

import { Suspense, useState } from 'react';
import ProjectManager from '@/components/ProjectManager';
import { useProjects } from '@/lib/useProjects';
import { useApiProjects } from '@/lib/useApiProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar, 
  FileText,
  Settings
} from 'lucide-react';

function ApiProjectsSection() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    projects: apiProjects, 
    loading, 
    error, 
    search, 
    clearSearch, 
    refetch,
    toggleDocumentFilter,
    showOnlyWithDocuments,
    totalCount,
    filteredCount
  } = useApiProjects();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    await search(term);
  };

  const handleClearSearch = async () => {
    setSearchTerm('');
    await clearSearch();
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          API Projects
        </CardTitle>
        <CardDescription>
          Projects fetched from HyperWaterBids API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search API projects..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
            <Button 
              variant={showOnlyWithDocuments ? "default" : "outline"} 
              size="sm" 
              onClick={toggleDocumentFilter}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showOnlyWithDocuments ? "With Docs" : "All"}
            </Button>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredCount} of {totalCount} projects
          </span>
          {showOnlyWithDocuments && filteredCount !== totalCount && (
            <span>
              (filtered to projects with documents)
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              <span>Loading API projects...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-start gap-2">
              <div className="text-destructive font-medium">
                Failed to load API projects
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="mt-3 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Projects List */}
        {!loading && !error && (
          <div className="space-y-3">
            {apiProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No projects found</p>
                {searchTerm ? (
                  <p className="text-sm">Try adjusting your search term</p>
                ) : showOnlyWithDocuments && totalCount > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm">No projects have documents uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleDocumentFilter}
                    >
                      Show all {totalCount} projects
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm">No API projects available</p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {apiProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{project.projectName}</h3>
                        <Badge variant="secondary">API</Badge>
                        {project.includedDocuments && (
                          <Badge variant={project.includedDocuments.length > 0 ? "default" : "outline"}>
                            <FileText className="h-3 w-3 mr-1" />
                            {project.includedDocuments.length} docs
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>ID: {project.id}</span>
                        {project.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          // Could add project details view or management actions
                          console.log('View project details:', project.id);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsAdminContent() {
  const { projects, updateProjects, isLoaded } = useProjects();

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div>Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Project Management
        </h1>
        <p className="text-muted-foreground">
          Manage both manual and API-based projects for the BidBoard system
        </p>
      </div>

      {/* Manual Projects Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Manual Projects</h2>
          <Badge variant="outline">{projects.length}</Badge>
        </div>
        <ProjectManager 
          projects={projects}
          onProjectsChange={updateProjects}
        />
      </div>

      {/* API Projects Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h2 className="text-xl font-semibold">API Projects</h2>
        </div>
        <ApiProjectsSection />
      </div>
    </div>
  );
}

export default function ProjectsAdmin() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <ProjectsAdminContent />
    </Suspense>
  );
} 