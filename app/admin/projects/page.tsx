'use client';

import { Suspense } from 'react';
import ProjectManager from '@/components/ProjectManager';
import { useProjects } from '@/lib/useProjects';

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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Project Management
        </h1>
        <p className="text-muted-foreground">
          Manage project ITB IDs for testing the BidBoard system
        </p>
      </div>

      <ProjectManager 
        projects={projects}
        onProjectsChange={updateProjects}
      />
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