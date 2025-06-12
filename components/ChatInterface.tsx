'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import SourceReference from './SourceReference';
import { ChatMessage, ChatMessageMetadata, Source, ChatConversation } from '@/lib/types';
import { queryGraphRAGForChat, parseSources } from '@/lib/graphRag';
import { ChatExportButton } from './ChatExportButton';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  loading: boolean;
  selectedProjects: string[];
  projectNames: Record<string, string>;
  activeConversation?: ChatConversation | null;
  allConversations?: ChatConversation[];
  onAddMessage: (content: string, type: 'user' | 'assistant' | 'system', metadata?: ChatMessageMetadata) => string;
  onUpdateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string | null) => void;
  className?: string;
}

export function ChatInterface({
  messages,
  loading,
  selectedProjects,
  projectNames,
  activeConversation,
  allConversations = [],
  onAddMessage,
  onUpdateMessage,
  onSetLoading,
  onSetError,
  className = ''
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || selectedProjects.length === 0) {
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');

    try {
      // Clear any previous errors
      onSetError(null);

      // Add user message
      onAddMessage(userMessage, 'user', {
        projectIds: [...selectedProjects],
      });

      // Set loading state
      onSetLoading(true);

      // Create assistant message placeholder
      const assistantMessageId = onAddMessage('', 'assistant', {
        projectIds: [...selectedProjects],
        responseTime: 0,
      });

      const startTime = Date.now();

      // Query GraphRAG for each selected project
      const responses: Array<{ projectId: string; response: string; sources: Source[] }> = [];

      for (const projectId of selectedProjects) {
        try {
          const response = await queryGraphRAGForChat(projectId, userMessage);
          const { cleanResponse, sources } = parseSources(response);
          
          responses.push({
            projectId,
            response: cleanResponse,
            sources,
          });
        } catch (error) {
          console.error(`Error querying project ${projectId}:`, error);
          responses.push({
            projectId,
            response: `Error querying project ${projectNames[projectId] || projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sources: [],
          });
        }
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Combine responses from multiple projects
      let combinedResponse = '';
      const allSources: Source[] = [];

      if (responses.length === 1) {
        // Single project response
        combinedResponse = responses[0].response;
        allSources.push(...responses[0].sources);
      } else {
        // Multiple project responses
        combinedResponse = responses
          .map(({ projectId, response }) => {
            const projectName = projectNames[projectId] || projectId;
            return `**${projectName}:**\n${response}`;
          })
          .join('\n\n');

                 // Collect all sources and deduplicate
         const sourceMap = new Map<string, Source>();
         responses.forEach(({ sources }) => {
           sources.forEach(source => {
             const key = `${source.filename}-${source.pageNum}-${source.section}`;
             if (!sourceMap.has(key)) {
               sourceMap.set(key, source);
             }
           });
         });
         allSources.push(...Array.from(sourceMap.values()));
      }

      // Update assistant message with response
      onUpdateMessage(assistantMessageId, {
        content: combinedResponse || 'I was unable to find relevant information for your question.',
        sources: allSources,
        metadata: {
          projectIds: [...selectedProjects],
          responseTime,
          tokensUsed: undefined, // Could be added if API provides this
          model: 'GraphRAG',
        },
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      onSetError(`Failed to send message: ${errorMessage}`);
      
      // Add error message
      onAddMessage(
        `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        'assistant',
        {
          projectIds: [...selectedProjects],
          error: errorMessage,
        }
      );
    } finally {
      onSetLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Enhanced markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const canSendMessage = inputValue.trim() && !loading && selectedProjects.length > 0;

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProjects.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
          {messages.length > 0 && (
            <ChatExportButton
              conversations={allConversations}
              activeConversationId={activeConversation?.id}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-4 min-h-[300px] sm:min-h-[400px] px-2 sm:px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
              <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="font-medium text-muted-foreground text-sm sm:text-base">Ready to chat!</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  {selectedProjects.length === 0 
                    ? 'Select projects to start asking questions about your documents.'
                    : 'Ask me anything about your selected project documents.'
                  }
                </p>
              </div>
              {selectedProjects.length > 0 && (
                <div className="space-y-2 w-full max-w-md">
                  <p className="text-xs text-muted-foreground">Selected projects:</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {selectedProjects.map(projectId => (
                      <Badge key={projectId} variant="secondary" className="text-xs">
                        {projectNames[projectId] || projectId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : message.type === 'system'
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          : 'bg-muted'
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(message.content),
                        }}
                        className="text-xs sm:text-sm leading-relaxed"
                      />
                    </div>
                    
                    {/* Sources for assistant messages */}
                    {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, index) => (
                            <SourceReference
                              key={index}
                              source={source}
                              itbId={message.metadata?.projectIds?.[0] || selectedProjects[0] || ''}
                              onError={(error) => console.error('Source reference error:', error)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Project context and metadata */}
                    {message.metadata && (
                      <div className="mt-2 space-y-1">
                        {message.metadata.projectIds && message.metadata.projectIds.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.projectIds.map(projectId => (
                              <Badge 
                                key={projectId} 
                                variant="outline" 
                                className="text-xs"
                              >
                                {projectNames[projectId] || projectId}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Response time for assistant messages */}
                        {message.type === 'assistant' && message.metadata.responseTime && (
                          <p className="text-xs text-muted-foreground">
                            Response time: {(message.metadata.responseTime / 1000).toFixed(1)}s
                          </p>
                        )}
                        
                        {/* Error indicator */}
                        {message.metadata.error && (
                          <p className="text-xs text-red-500">
                            Error: {message.metadata.error}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 order-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading message */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t pt-3 sm:pt-4 px-2 sm:px-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedProjects.length === 0
                  ? "Select projects first..."
                  : "Ask a question about your documents..."
              }
              disabled={loading || selectedProjects.length === 0}
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              size="sm"
              className="px-2 sm:px-3 flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {selectedProjects.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Please select at least one project to start chatting.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 