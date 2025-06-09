'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectManagerProps {
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onProjectsChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ id: '', name: '', description: '' });
  const [editProject, setEditProject] = useState({ id: '', name: '', description: '' });

  const handleAddProject = () => {
    if (!newProject.id.trim()) return;
    
    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newProject.id)) {
      alert('Please enter a valid UUID format (e.g., 12345678-1234-1234-1234-123456789012)');
      return;
    }

    // Check for duplicate IDs
    if (projects.some(p => p.id === newProject.id)) {
      alert('A project with this ID already exists');
      return;
    }

    const updatedProjects = [...projects, { ...newProject }];
    onProjectsChange(updatedProjects);
    
    setNewProject({ id: '', name: '', description: '' });
    setIsAdding(false);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== id);
      onProjectsChange(updatedProjects);
    }
  };

  const handleStartEdit = (project: Project) => {
    setEditProject({ ...project });
    setEditingId(project.id);
  };

  const handleSaveEdit = () => {
    if (!editProject.name.trim()) return;

    const updatedProjects = projects.map(p => 
      p.id === editingId ? { ...editProject } : p
    );
    onProjectsChange(updatedProjects);
    
    setEditingId(null);
    setEditProject({ id: '', name: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditProject({ id: '', name: '', description: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Project ITB IDs
          <Button 
            onClick={() => setIsAdding(true)} 
            size="sm"
            disabled={isAdding}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </CardTitle>
        <CardDescription>
          Manage the list of project ITB IDs for testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Project Form */}
          {isAdding && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Add New Project</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Project ID (UUID)</label>
                  <Input
                    placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                    value={newProject.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    placeholder="e.g., Project Alpha"
                    value={newProject.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Brief description of the project"
                    value={newProject.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddProject} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Add Project
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAdding(false);
                      setNewProject({ id: '', name: '', description: '' });
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Project List */}
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-3">
                {editingId === project.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Project Name</label>
                      <Input
                        value={editProject.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditProject({ ...editProject, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editProject.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditProject({ ...editProject, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{project.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono mb-1">
                        {project.id}
                      </p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        onClick={() => handleStartEdit(project)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No projects configured. Add a project to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectManager; 