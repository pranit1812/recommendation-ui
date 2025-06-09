'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePacksStore } from '@/store/packs';
import { TestResult, TestRun } from '@/lib/types';
import { useProjects } from '@/lib/useProjects';
import { buildPrompt, queryGraphRAG, extractAnswer, parseSources } from '@/lib/graphRag';
import { calculateScore, evaluateAnswer } from '@/lib/scoring';
import { Play, Download, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import SourceReference from '@/components/SourceReference';

function TestRunnerContent() {
  const searchParams = useSearchParams();
  const { getPackById, getAllPacks } = usePacksStore();
  const { projects, isLoaded } = useProjects();
  
  const [selectedPackId, setSelectedPackId] = useState(searchParams.get('pack') || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allPacks = getAllPacks();
  const selectedPack = selectedPackId ? getPackById(selectedPackId) : null;

  // Set default project when projects load
  useEffect(() => {
    if (isLoaded && projects.length > 0 && !selectedProjectId) {
      const projectFromUrl = searchParams.get('project');
      const defaultProject = projectFromUrl || projects[0].id;
      setSelectedProjectId(defaultProject);
    }
  }, [isLoaded, projects, selectedProjectId, searchParams]);

  const runTest = async () => {
    if (!selectedPack) return;
    
    setIsRunning(true);
    setError(null);
    setCurrentQuestion(0);
    
    const results: TestResult[] = [];
    
    try {
      for (let i = 0; i < selectedPack.questions.length; i++) {
        const question = selectedPack.questions[i];
        setCurrentQuestion(i + 1);
        
        // Build prompt for this question
        const prompt = buildPrompt(question);
        
        try {
          // Query GraphRAG
          const rawResponse = await queryGraphRAG(selectedProjectId, prompt);
          
          // Parse response and extract answer
          const { cleanResponse, sources } = parseSources(rawResponse);
          const answer = extractAnswer(rawResponse, question.type);
          const passed = evaluateAnswer(question, answer);
          
          const result: TestResult = {
            questionId: question.id,
            question: question.text,
            answer,
            rawResponse: cleanResponse,
            passed,
            sources,
            critical: question.critical,
            weight: question.weight
          };
          
          results.push(result);
          
        } catch (questionError) {
          console.error(`Error processing question ${i + 1}:`, questionError);
          
          // Add failed result for this question
          const result: TestResult = {
            questionId: question.id,
            question: question.text,
            answer: 'Error',
            rawResponse: `Error: ${questionError instanceof Error ? questionError.message : 'Unknown error'}`,
            passed: false,
            sources: [],
            critical: question.critical,
            weight: question.weight
          };
          
          results.push(result);
          
          // Continue to next question (no early stopping)
        }
      }
      
      // Calculate final score
      const scoreResult = calculateScore(results);
      
      const newTestRun: TestRun = {
        id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        packId: selectedPack.id,
        projectId: selectedProjectId,
        results,
        score: scoreResult.finalScore,
        passed: scoreResult.verdict === 'Bid',
        completedAt: new Date()
      };
      
      setTestRun(newTestRun);
      
    } catch (error) {
      console.error('Test run failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
      setCurrentQuestion(0);
    }
  };

  const downloadPDF = async () => {
    if (!testRun) return;
    
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testRun,
          pack: selectedPack
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-results-${testRun.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Test Runner
        </h1>
        <p className="text-muted-foreground">
          Execute question packs against demo projects
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Question Pack</CardTitle>
            <CardDescription>Choose a question pack to run</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isRunning}
            >
              <option value="">Select a pack...</option>
              {allPacks.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name} ({pack.questions.length} questions)
                </option>
              ))}
            </select>
            
            {selectedPack && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium">{selectedPack.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPack.questions.length} questions • {selectedPack.trades.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Demo Project</CardTitle>
            <CardDescription>Choose a project to test against</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isRunning}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.id.slice(0, 8)}...)
                </option>
              ))}
            </select>
            
            <div className="mt-4">
              <Button
                onClick={runTest}
                disabled={!selectedPack || isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Test... ({currentQuestion}/{selectedPack?.questions.length || 0})
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Test Failed</p>
            </div>
            <p className="text-sm text-destructive mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {testRun && (
        <div className="space-y-6">
          {/* Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <Button onClick={downloadPDF} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{testRun.score}</p>
                  <p className="text-sm text-muted-foreground">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{testRun.results.filter(r => r.passed).length}</p>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{testRun.results.filter(r => !r.passed).length}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
              
              <div className={`p-3 rounded-md ${
                testRun.passed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-medium ${
                  testRun.passed ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testRun.passed ? 'Project Passed' : 'Project Failed'}
                </p>
                <p className={`text-sm ${
                  testRun.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  Project {testRun.projectId.slice(0, 8)}... scored {testRun.score}/100.
                  {testRun.score === 0 && testRun.results.some(r => r.critical && !r.passed) 
                    ? ' Critical failure - immediate disqualification.' 
                    : testRun.passed 
                      ? ' Recommended for bidding.' 
                      : ' Does not meet minimum requirements.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Question Results</CardTitle>
              <CardDescription>
                Detailed results for each question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testRun.results.map((result, index) => (
                  <div key={result.questionId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">Question {index + 1}</span>
                          {result.critical && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.question}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Answer:</span> {result.answer}
                        </p>
                      </div>
                    </div>
                    
                    {result.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.sources.map((source, sourceIndex) => (
                            <SourceReference
                              key={sourceIndex}
                              source={source}
                              itbId={selectedProjectId}
                              onError={(error) => {
                                console.error('Source error:', error);
                                // Could show a toast notification here
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TestRunner() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <TestRunnerContent />
    </Suspense>
  );
} 