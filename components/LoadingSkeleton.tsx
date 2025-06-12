'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type?: 'projects' | 'messages' | 'tabs' | 'full';
  count?: number;
}

export function LoadingSkeleton({ type = 'full', count = 3 }: LoadingSkeletonProps) {
  if (type === 'projects') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'messages') {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
            <div className={`max-w-[80%] ${i % 2 === 1 ? 'order-1' : ''}`}>
              <div className="space-y-2 p-3 rounded-lg bg-muted">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                {i === 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                )}
              </div>
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
            {i % 2 === 1 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 order-2" />}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'tabs') {
    return (
      <div className="flex gap-2 mb-4 p-1">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
        <Skeleton className="h-9 w-20 ml-auto" />
      </div>
    );
  }

  // Full loading state
  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Project Selector Skeleton */}
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex border-b">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28 ml-4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <LoadingSkeleton type="projects" count={2} />
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface Skeleton */}
      <div className="flex-1 min-w-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <LoadingSkeleton type="tabs" count={2} />
            <div className="flex-1 min-h-[400px]">
              <LoadingSkeleton type="messages" count={3} />
            </div>
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 