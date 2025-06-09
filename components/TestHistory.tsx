'use client';

import { useState } from 'react';
import { SavedTestResult } from '@/lib/types';
import { useTestHistory } from '@/lib/useTestHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Download,
  Calendar,
  Award,
  FileText
} from 'lucide-react';

interface TestHistoryProps {
  onViewResult?: (result: SavedTestResult) => void;
}

export default function TestHistory({ onViewResult }: TestHistoryProps) {
  const { savedResults, isLoading, deleteTestResult } = useTestHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'pack' | 'project'>('date');

  // Filter results based on search term
  const filteredResults = savedResults.filter(result => 
    result.packName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.testRun.verdict.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'score':
        return b.testRun.finalScore - a.testRun.finalScore;
      case 'pack':
        return a.packName.localeCompare(b.packName);
      case 'project':
        return a.projectName.localeCompare(b.projectName);
      default:
        return 0;
    }
  });

  const getVerdictBadge = (verdict: string) => {
    const colors = {
      'Pass': 'bg-green-100 text-green-700 border-green-200',
      'Bid': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Fail (critical)': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[verdict as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDownloadPDF = async (result: SavedTestResult) => {
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRun: result.testRun,
          pack: { id: result.packId, name: result.packName }
        })
      });

      if (response.ok) {
        const htmlContent = await response.text();
        const filename = `${result.packName}-${result.projectName}-${formatDate(result.createdAt)}.pdf`;
        
        // Create a new window/tab and print to PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for content to load then trigger print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 100);
          };
        } else {
          // Fallback: download as HTML if popup blocked
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename.replace('.pdf', '.html');
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          alert('PDF generation not available. Downloaded HTML file instead. Use your browser\'s print function to save as PDF.');
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading test history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Test History
        </CardTitle>
        <CardDescription>
          View and manage saved test results. Results are automatically saved when tests complete.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by pack name, project, or verdict..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'pack' | 'project')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
            <option value="pack">Sort by Pack</option>
            <option value="project">Sort by Project</option>
          </select>
        </div>

        {sortedResults.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchTerm ? 'No results found' : 'No test history yet'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Run some tests to see results here'
              }
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question Pack</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="font-medium">{result.packName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.testRun.results.length} questions
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{result.projectName}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {result.projectId.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getVerdictBadge(result.testRun.verdict)}>
                        {result.testRun.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{result.testRun.finalScore}%</span>
                        {result.testRun.hasCriticalFail && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(result.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onViewResult && (
                            <DropdownMenuItem onClick={() => onViewResult(result)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadPDF(result)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteTestResult(result.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {sortedResults.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{sortedResults.length}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {sortedResults.filter(r => r.testRun.verdict === 'Pass').length}
              </div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">
                {sortedResults.filter(r => r.testRun.verdict === 'Bid').length}
              </div>
              <div className="text-sm text-yellow-600">Bid Required</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">
                {sortedResults.filter(r => r.testRun.verdict === 'Fail (critical)').length}
              </div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 