'use client';

import { useState, useEffect, Suspense } from 'react';
import { ProjectSelector } from '@/components/ProjectSelector';
import { ChatInterface } from '@/components/ChatInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useChatHistory } from '@/lib/useChatHistory';
import { useProjects } from '@/lib/useProjects';
import { useApiProjects } from '@/lib/useApiProjects';

function ChatPageContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  // Chat history management
  const {
    conversations,
    activeConversationId,
    isLoading,
    error: chatError,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    updateMessage,
    setLoading,
    setError,
    clearError,
  } = useChatHistory();

  // Project data
  const { projects: manualProjects } = useProjects();
  const { projects: apiProjects } = useApiProjects();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePageError = (error: Error) => {
    console.error('Chat page error:', error);
    setPageError(error.message);
  };

  if (!mounted) {
    return <LoadingSkeleton type="full" />;
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Document Chat
          </h1>
          <p className="text-muted-foreground">
            Have natural conversations with your project documents
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <ErrorBoundary
            fallback={
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium text-destructive">Failed to load chat</h3>
                <p className="text-muted-foreground">{pageError}</p>
                <Button onClick={() => setPageError(null)}>Try Again</Button>
              </div>
            }
          >
            <div />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreateNewConversation = () => {
    if (selectedProjects.length === 0) return;

    // Create project names array
    const projectNames = selectedProjects.map(id => {
      // Try to find the project name from manual projects first
      const manualProject = manualProjects.find(p => p.id === id);
      if (manualProject) return manualProject.name;
      
      // Then try API projects
      const apiProject = apiProjects.find(p => p.id === id);
      if (apiProject) return apiProject.projectName;
      
      // Fallback to shortened ID
      return `Project ${id.slice(0, 8)}...`;
    });

    createConversation(selectedProjects, projectNames);
  };

  const handleCloseConversation = (conversationId: string) => {
    deleteConversation(conversationId);
  };



  // Create project names mapping for all projects
  const projectNames: Record<string, string> = {};
  
  // Add manual projects
  manualProjects.forEach(project => {
    projectNames[project.id] = project.name;
  });
  
  // Add API projects
  apiProjects.forEach(project => {
    projectNames[project.id] = project.projectName;
  });

  // Get conversation list for tabs
  const conversationList = Object.values(conversations).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Document Chat
        </h1>
        <p className="text-muted-foreground">
          Have natural conversations with your project documents
        </p>
      </div>

      {/* Error Display */}
      {chatError && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-destructive text-sm">{chatError}</p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-12rem)]">
        {/* Project Selection Sidebar */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
          <div className="lg:sticky lg:top-6">
            <ErrorBoundary
              onError={handlePageError}
              fallback={
                <div className="p-4 border rounded-lg bg-destructive/10 text-destructive text-sm">
                  <p className="font-medium">Project selector failed to load</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>
              }
            >
              <ProjectSelector
                selectedProjects={selectedProjects}
                onProjectToggle={handleProjectToggle}
                maxSelections={5}
                className="h-fit max-h-[40vh] lg:max-h-[calc(100vh-8rem)]"
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <ErrorBoundary
            onError={handlePageError}
            fallback={
              <div className="h-full flex items-center justify-center border rounded-lg bg-destructive/10">
                <div className="text-center space-y-4 p-6">
                  <h3 className="text-lg font-medium text-destructive">Chat interface failed to load</h3>
                  <p className="text-muted-foreground text-sm">
                    There was an error loading the chat interface.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                </div>
              </div>
            }
          >
            {conversationList.length === 0 ? (
              <div className="h-full min-h-[500px] lg:min-h-[600px] flex flex-col items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center space-y-4 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No conversations yet</h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Select projects and start a new conversation to chat with your documents
                  </p>
                  <Button 
                    onClick={handleCreateNewConversation}
                    disabled={selectedProjects.length === 0}
                    className="gap-2"
                    size="default"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Start New Conversation</span>
                    <span className="sm:hidden">Start Chat</span>
                  </Button>
                  {selectedProjects.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Please select at least one project first
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Tabs value={activeConversationId || ''} onValueChange={switchConversation} className="h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 p-1">
                  <div className="flex-1 min-w-0">
                    <TabsList className="w-full h-auto flex-wrap justify-start p-1">
                      {conversationList.map((conversation) => (
                        <TabsTrigger 
                          key={conversation.id} 
                          value={conversation.id} 
                          className="relative group flex-shrink-0 h-9 px-2 sm:px-3"
                        >
                          <div className="flex items-center gap-1 sm:gap-2 max-w-[120px] sm:max-w-[180px]">
                            <span className="truncate text-xs sm:text-sm">
                              {conversation.title || conversation.projectNames.join(', ')}
                            </span>
                            <Badge variant="secondary" className="text-xs h-4 px-1">
                              {conversation.projectIds.length}
                            </Badge>
                            {conversationList.length > 1 && (
                              <div
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded hover:bg-destructive/20 flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseConversation(conversation.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  <Button 
                    onClick={handleCreateNewConversation}
                    disabled={selectedProjects.length === 0}
                    size="sm"
                    variant="outline"
                    className="gap-2 flex-shrink-0 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Chat</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>

                {conversationList.map((conversation) => (
                  <TabsContent key={conversation.id} value={conversation.id} className="flex-1 mt-0 h-full">
                    <ChatInterface
                      messages={conversation.messages}
                      loading={isLoading}
                      selectedProjects={conversation.projectIds}
                      projectNames={projectNames}
                      activeConversation={conversation}
                      allConversations={conversationList}
                      onAddMessage={addMessage}
                      onUpdateMessage={updateMessage}
                      onSetLoading={setLoading}
                      onSetError={setError}
                      className="h-full min-h-[400px]"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
} 