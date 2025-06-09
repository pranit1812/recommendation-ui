'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCatalogStore } from '@/store/catalog';
import { usePacksStore } from '@/store/packs';
import { useProjects } from '@/lib/useProjects';
import { useTestHistory } from '@/lib/useTestHistory';
import { FileText, Settings, Play, Plus, Database, History } from 'lucide-react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { catalog, loadCatalogFromUrl, lastUpdated } = useCatalogStore();
  const { packs, loadFromStorage: loadPacks } = usePacksStore();
  const { projects, isLoaded } = useProjects();
  const { savedResults } = useTestHistory();

  useEffect(() => {
    setMounted(true);
    // Load packs from localStorage
    loadPacks();
  }, [loadPacks]);

  useEffect(() => {
    // Auto-load the bundled Excel file on first visit
    if (mounted && catalog.length === 0) {
      loadCatalogFromUrl('/csi_master.xlsx');
    }
  }, [mounted, catalog.length, loadCatalogFromUrl]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          BidBoard Test Harness
        </h1>
        <p className="text-muted-foreground">
          Excel-driven prototype for testing project requirements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Catalog
            </CardTitle>
            <CardDescription>
              {catalog.length} questions from {new Set(catalog.map(c => c.trade)).size} trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {lastUpdated 
                ? `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`
                : 'Not loaded'
              }
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/catalog">
                <Settings className="mr-2 h-4 w-4" />
                Manage Catalog
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Question Packs
            </CardTitle>
            <CardDescription>
              {packs.length} packs created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage question packs for testing
            </p>
            <Button asChild className="w-full">
              <Link href="/pack/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Pack
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              {isLoaded ? `${projects.length} ITB IDs configured` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage project ITB IDs for testing
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/projects">
                <Settings className="mr-2 h-4 w-4" />
                Manage Projects
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Runner
            </CardTitle>
            <CardDescription>
              Run tests against projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Execute question packs against GraphRAG endpoints
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/run">
                <Play className="mr-2 h-4 w-4" />
                Run Tests
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Test History
            </CardTitle>
            <CardDescription>
              {savedResults.length} test results saved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage saved test results
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/run?tab=history">
                <History className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {packs.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Question Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.slice(0, 6).map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <CardDescription>
                    {pack.questions.length} questions • {pack.trades.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/pack/${pack.id}`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/run?pack=${pack.id}`}>Run Test</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 