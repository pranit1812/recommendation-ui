'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCatalogStore } from '@/store/catalog';
import { Upload, FileText, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CatalogAdmin() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { 
    catalog, 
    lastUpdated, 
    isLoading, 
    error, 
    loadCatalogFromFile, 
    loadCatalogFromUrl,
    getAllTrades 
  } = useCatalogStore();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx')) {
        loadCatalogFromFile(file);
      } else {
        alert('Please upload an Excel (.xlsx) file');
      }
    }
  }, [loadCatalogFromFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      loadCatalogFromFile(file);
    }
  };

  const reloadFromDefault = () => {
    loadCatalogFromUrl('/csi_master.xlsx');
  };

  const trades = mounted ? getAllTrades() : [];

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Catalog Administration
        </h1>
        <p className="text-muted-foreground">
          Manage the Excel-driven question catalog
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Catalog
            </CardTitle>
            <CardDescription>
              Drag and drop an Excel file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop Excel file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse for .xlsx files
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="secondary" 
                onClick={reloadFromDefault}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Reload Default Catalog
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Catalog Status
            </CardTitle>
            <CardDescription>
              Information about the loaded catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Total Questions</p>
                <p className="text-2xl font-bold">{catalog.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Trades/Divisions</p>
                <p className="text-2xl font-bold">{trades.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated 
                    ? new Date(lastUpdated).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
              
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium">Error</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              
              {isLoading && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm text-primary">Loading catalog...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trades Overview */}
      {trades.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Trades/Divisions</CardTitle>
            <CardDescription>
              Overview of all trades in the current catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trades.map((trade) => {
                const tradeQuestions = catalog.filter(item => item.trade === trade);
                return (
                  <div key={trade} className="p-3 border rounded-md">
                    <p className="font-medium text-sm">{trade}</p>
                    <p className="text-xs text-muted-foreground">
                      {tradeQuestions.length} questions
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 