import { useState, useCallback, useEffect } from 'react';
import { 
  ChatState, 
  ChatConversation, 
  ChatMessage, 
  ChatMessageMetadata,
  Source 
} from './types';
import { v4 as uuidv4 } from 'uuid';

interface UseChatHistoryOptions {
  maxConversations?: number;    // Maximum conversations to keep in memory
  maxMessagesPerConversation?: number; // Maximum messages per conversation
  persistToStorage?: boolean;   // Whether to persist to localStorage
}

interface UseChatHistoryReturn {
  // State
  conversations: Record<string, ChatConversation>;
  activeConversation: ChatConversation | null;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (projectIds: string[], projectNames: string[]) => string;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  addMessage: (content: string, type: 'user' | 'assistant' | 'system', metadata?: ChatMessageMetadata) => string;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  addSourcesToLastMessage: (sources: Source[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Conversation management
  updateConversationTitle: (conversationId: string, title: string) => void;
  getConversationsByProject: (projectId: string) => ChatConversation[];
  getTotalMessageCount: () => number;
  
  // Persistence
  exportConversations: () => ChatConversation[];
  importConversations: (conversations: ChatConversation[]) => void;
  clearAllConversations: () => void;
}

const STORAGE_KEY = 'chat_history';
const DEFAULT_OPTIONS: UseChatHistoryOptions = {
  maxConversations: 50,
  maxMessagesPerConversation: 500,
  persistToStorage: true,
};

export function useChatHistory(options: UseChatHistoryOptions = {}): UseChatHistoryReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<ChatState>({
    conversations: {},
    activeConversationId: null,
    isLoading: false,
    error: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (!config.persistToStorage) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState: ChatState = JSON.parse(stored);
        
        // Convert date strings back to Date objects
        const conversations: Record<string, ChatConversation> = {};
        Object.entries(parsedState.conversations || {}).forEach(([id, conv]) => {
          conversations[id] = {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          };
        });
        
        setState(prev => ({
          ...prev,
          conversations,
          activeConversationId: parsedState.activeConversationId,
        }));
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage:', error);
    }
  }, [config.persistToStorage]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!config.persistToStorage) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save chat history to localStorage:', error);
    }
  }, [state, config.persistToStorage]);

  // Create a new conversation
  const createConversation = useCallback((projectIds: string[], projectNames: string[]): string => {
    const conversationId = uuidv4();
    const now = new Date();
    
    const newConversation: ChatConversation = {
      id: conversationId,
      projectIds: [...projectIds],
      projectNames: [...projectNames],
      messages: [],
      createdAt: now,
      updatedAt: now,
      title: `${projectNames.join(', ')} - ${now.toLocaleDateString()}`,
    };

    setState(prev => {
      const conversations = { ...prev.conversations };
      
      // Add new conversation
      conversations[conversationId] = newConversation;
      
      // Enforce max conversations limit
      if (config.maxConversations && Object.keys(conversations).length > config.maxConversations) {
        const sortedConversations = Object.values(conversations)
          .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
        
        // Remove oldest conversations
        const toRemove = sortedConversations.slice(0, Object.keys(conversations).length - config.maxConversations);
        toRemove.forEach(conv => delete conversations[conv.id]);
      }
      
      return {
        ...prev,
        conversations,
        activeConversationId: conversationId,
        error: null,
      };
    });

    return conversationId;
  }, [config.maxConversations]);

  // Switch active conversation
  const switchConversation = useCallback((conversationId: string) => {
    setState(prev => {
      if (!prev.conversations[conversationId]) {
        return prev;
      }
      
      return {
        ...prev,
        activeConversationId: conversationId,
        error: null,
      };
    });
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setState(prev => {
      const conversations = { ...prev.conversations };
      delete conversations[conversationId];
      
      const activeId = prev.activeConversationId === conversationId 
        ? Object.keys(conversations)[0] || null 
        : prev.activeConversationId;
      
      return {
        ...prev,
        conversations,
        activeConversationId: activeId,
      };
    });
  }, []);

  // Add a message to the active conversation
  const addMessage = useCallback((
    content: string, 
    type: 'user' | 'assistant' | 'system', 
    metadata?: ChatMessageMetadata
  ): string => {
    if (!state.activeConversationId) {
      throw new Error('No active conversation to add message to');
    }

    const messageId = uuidv4();
    const now = new Date();
    
    const newMessage: ChatMessage = {
      id: messageId,
      type,
      content,
      timestamp: now,
      sources: [],
      metadata,
    };

    setState(prev => {
      const conversations = { ...prev.conversations };
      const activeConv = conversations[prev.activeConversationId!];
      
      if (!activeConv) return prev;
      
      const updatedMessages = [...activeConv.messages, newMessage];
      
      // Enforce max messages per conversation
      if (config.maxMessagesPerConversation && updatedMessages.length > config.maxMessagesPerConversation) {
        updatedMessages.splice(0, updatedMessages.length - config.maxMessagesPerConversation);
      }
      
      conversations[prev.activeConversationId!] = {
        ...activeConv,
        messages: updatedMessages,
        updatedAt: now,
      };
      
      return {
        ...prev,
        conversations,
      };
    });

    return messageId;
  }, [state.activeConversationId, config.maxMessagesPerConversation]);

  // Update an existing message
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    if (!state.activeConversationId) return;

    setState(prev => {
      const conversations = { ...prev.conversations };
      const activeConv = conversations[prev.activeConversationId!];
      
      if (!activeConv) return prev;
      
      const messageIndex = activeConv.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return prev;
      
      const updatedMessages = [...activeConv.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        ...updates,
      };
      
      conversations[prev.activeConversationId!] = {
        ...activeConv,
        messages: updatedMessages,
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        conversations,
      };
    });
  }, [state.activeConversationId]);

  // Add sources to the last assistant message
  const addSourcesToLastMessage = useCallback((sources: Source[]) => {
    if (!state.activeConversationId) return;

    setState(prev => {
      const conversations = { ...prev.conversations };
      const activeConv = conversations[prev.activeConversationId!];
      
      if (!activeConv || activeConv.messages.length === 0) return prev;
      
      const updatedMessages = [...activeConv.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      
      if (lastMessage.type === 'assistant') {
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          sources: [...(lastMessage.sources || []), ...sources],
        };
        
        conversations[prev.activeConversationId!] = {
          ...activeConv,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
      }
      
      return {
        ...prev,
        conversations,
      };
    });
  }, [state.activeConversationId]);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setState(prev => {
      const conversations = { ...prev.conversations };
      const conversation = conversations[conversationId];
      
      if (!conversation) return prev;
      
      conversations[conversationId] = {
        ...conversation,
        title,
        updatedAt: new Date(),
      };
      
      return {
        ...prev,
        conversations,
      };
    });
  }, []);

  // Get conversations by project ID
  const getConversationsByProject = useCallback((projectId: string): ChatConversation[] => {
    return Object.values(state.conversations)
      .filter(conv => conv.projectIds.includes(projectId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [state.conversations]);

  // Get total message count across all conversations
  const getTotalMessageCount = useCallback((): number => {
    return Object.values(state.conversations)
      .reduce((total, conv) => total + conv.messages.length, 0);
  }, [state.conversations]);

  // Export all conversations
  const exportConversations = useCallback((): ChatConversation[] => {
    return Object.values(state.conversations)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [state.conversations]);

  // Import conversations
  const importConversations = useCallback((conversations: ChatConversation[]) => {
    const conversationsMap: Record<string, ChatConversation> = {};
    conversations.forEach(conv => {
      conversationsMap[conv.id] = {
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    });
    
    setState(prev => ({
      ...prev,
      conversations: conversationsMap,
      activeConversationId: Object.keys(conversationsMap)[0] || null,
    }));
  }, []);

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversations: {},
      activeConversationId: null,
      error: null,
    }));
  }, []);

  // Get active conversation
  const activeConversation = state.activeConversationId 
    ? state.conversations[state.activeConversationId] || null 
    : null;

  return {
    // State
    conversations: state.conversations,
    activeConversation,
    activeConversationId: state.activeConversationId,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    updateMessage,
    addSourcesToLastMessage,
    setLoading,
    setError,
    clearError,
    
    // Conversation management
    updateConversationTitle,
    getConversationsByProject,
    getTotalMessageCount,
    
    // Persistence
    exportConversations,
    importConversations,
    clearAllConversations,
  };
} 