'use client';

import { useState, useEffect } from 'react';
import { SavedTestResult, TestRun, QuestionPack } from './types';

const STORAGE_KEY = 'bidboard-test-history';

export function useTestHistory() {
  const [savedResults, setSavedResults] = useState<SavedTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved results from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const results = parsed.map((result: any) => ({
          ...result,
          createdAt: new Date(result.createdAt),
          testRun: {
            ...result.testRun,
            completedAt: new Date(result.testRun.completedAt)
          }
        }));
        setSavedResults(results);
      }
    } catch (error) {
      console.error('Error loading test history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResults));
      } catch (error) {
        console.error('Error saving test history:', error);
      }
    }
  }, [savedResults, isLoading]);

  const saveTestResult = (
    testRun: TestRun,
    pack: QuestionPack,
    projectName: string
  ) => {
    const resultKey = `${pack.id}-${testRun.projectId}`;
    
    const savedResult: SavedTestResult = {
      id: resultKey,
      packId: pack.id,
      packName: pack.name,
      projectId: testRun.projectId,
      projectName,
      testRun,
      createdAt: new Date()
    };

    setSavedResults(prev => {
      // Remove any existing result with the same pack+project combination
      const filtered = prev.filter(result => result.id !== resultKey);
      // Add the new result at the beginning (most recent first)
      return [savedResult, ...filtered];
    });

    return savedResult;
  };

  const deleteTestResult = (resultId: string) => {
    setSavedResults(prev => prev.filter(result => result.id !== resultId));
  };

  const getTestResult = (packId: string, projectId: string): SavedTestResult | undefined => {
    const resultKey = `${packId}-${projectId}`;
    return savedResults.find(result => result.id === resultKey);
  };

  const getAllResultsForPack = (packId: string): SavedTestResult[] => {
    return savedResults.filter(result => result.packId === packId);
  };

  const getAllResultsForProject = (projectId: string): SavedTestResult[] => {
    return savedResults.filter(result => result.projectId === projectId);
  };

  const clearAllResults = () => {
    setSavedResults([]);
  };

  return {
    savedResults,
    isLoading,
    saveTestResult,
    deleteTestResult,
    getTestResult,
    getAllResultsForPack,
    getAllResultsForProject,
    clearAllResults
  };
} 