import { useState, useEffect } from 'react';
import { Project } from '@/components/ProjectManager';
import projectsData from '@/config/projectIds.json';

const STORAGE_KEY = 'bidboard-projects';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load projects from localStorage or fallback to JSON file
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProjects = JSON.parse(stored);
        setProjects(parsedProjects);
      } else {
        // Use projects from JSON file as default
        setProjects(projectsData.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Fallback to JSON file
      setProjects(projectsData.projects);
    }
    setIsLoaded(true);
  }, []);

  // Save projects to localStorage whenever they change
  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  // Get array of project IDs for compatibility with existing code
  const getProjectIds = () => projects.map(p => p.id);

  return {
    projects,
    updateProjects,
    getProjectIds,
    isLoaded
  };
} 