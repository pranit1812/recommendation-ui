import { ChatConversation, ChatExportOptions, ChatExportData } from './types';

/**
 * Utility functions for exporting chat conversations in various formats
 */

/**
 * Export conversations to CSV format
 */
export function exportToCSV(
  conversations: ChatConversation[],
  options: ChatExportOptions
): string {
  const headers = [
    'Conversation ID',
    'Conversation Title',
    'Message ID',
    'Message Type',
    'Content',
    'Timestamp',
    ...(options.includeMetadata ? ['Response Time (s)', 'Model', 'Error'] : []),
    ...(options.includeSources ? ['Sources Count', 'Source Files'] : []),
    ...(options.includeTimestamps ? ['Created At', 'Updated At'] : []),
    'Project IDs',
    'Project Names'
  ];

  const rows = [headers.join(',')];

  conversations.forEach(conversation => {
    conversation.messages.forEach(message => {
      const row = [
        `"${conversation.id}"`,
        `"${conversation.title || ''}"`,
        `"${message.id}"`,
        `"${message.type}"`,
        `"${message.content.replace(/"/g, '""')}"`,
        `"${message.timestamp.toISOString()}"`,
        ...(options.includeMetadata ? [
          `"${message.metadata?.responseTime ? (message.metadata.responseTime / 1000).toFixed(2) : ''}"`,
          `"${message.metadata?.model || ''}"`,
          `"${message.metadata?.error || ''}"`
        ] : []),
        ...(options.includeSources ? [
          `"${message.sources?.length || 0}"`,
          `"${message.sources?.map(s => s.filename).join('; ') || ''}"`
        ] : []),
        ...(options.includeTimestamps ? [
          `"${conversation.createdAt.toISOString()}"`,
          `"${conversation.updatedAt.toISOString()}"`
        ] : []),
        `"${conversation.projectIds.join('; ')}"`,
        `"${conversation.projectNames.join('; ')}"`
      ];

      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
}

/**
 * Export conversations to plain text format
 */
export function exportToTXT(
  conversations: ChatConversation[],
  options: ChatExportOptions
): string {
  const sections: string[] = [];

  // Header
  sections.push('CHAT EXPORT');
  sections.push('='.repeat(50));
  sections.push(`Exported: ${new Date().toLocaleString()}`);
  sections.push(`Conversations: ${conversations.length}`);
  sections.push(`Total Messages: ${conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}`);
  sections.push('');

  conversations.forEach((conversation, index) => {
    sections.push(`CONVERSATION ${index + 1}`);
    sections.push('-'.repeat(30));
    sections.push(`Title: ${conversation.title || 'Untitled'}`);
    sections.push(`ID: ${conversation.id}`);
    sections.push(`Projects: ${conversation.projectNames.join(', ')}`);
    sections.push(`Messages: ${conversation.messages.length}`);
    
    if (options.includeTimestamps) {
      sections.push(`Created: ${conversation.createdAt.toLocaleString()}`);
      sections.push(`Updated: ${conversation.updatedAt.toLocaleString()}`);
    }
    
    sections.push('');

    conversation.messages.forEach((message, msgIndex) => {
      const messageHeader = `[${msgIndex + 1}] ${message.type.toUpperCase()}`;
      sections.push(messageHeader);
      sections.push(`Time: ${message.timestamp.toLocaleString()}`);
      
      if (options.includeMetadata && message.metadata) {
        if (message.metadata.responseTime) {
          sections.push(`Response Time: ${(message.metadata.responseTime / 1000).toFixed(2)}s`);
        }
        if (message.metadata.model) {
          sections.push(`Model: ${message.metadata.model}`);
        }
        if (message.metadata.error) {
          sections.push(`Error: ${message.metadata.error}`);
        }
      }
      
      sections.push('');
      sections.push(message.content);
      
      if (options.includeSources && message.sources && message.sources.length > 0) {
        sections.push('');
        sections.push('Sources:');
        message.sources.forEach((source, sourceIndex) => {
          sections.push(`  ${sourceIndex + 1}. ${source.humanReadable}`);
          sections.push(`     File: ${source.filename}`);
          if (source.pageNum > 0) {
            sections.push(`     Page: ${source.pageNum}`);
          }
          if (source.section) {
            sections.push(`     Section: ${source.section}`);
          }
        });
      }
      
      sections.push('');
      sections.push('~'.repeat(20));
      sections.push('');
    });

    sections.push('');
  });

  return sections.join('\n');
}

/**
 * Export conversations to JSON format
 */
export function exportToJSON(
  conversations: ChatConversation[],
  options: ChatExportOptions
): string {
  const exportData: ChatExportData = {
    conversations: conversations.map(conv => ({
      id: conv.id,
      projectIds: conv.projectIds,
      projectNames: conv.projectNames,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        sources: options.includeSources ? msg.sources : undefined,
        metadata: options.includeMetadata ? msg.metadata : undefined,
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      title: conv.title,
    })),
    exportedAt: new Date(),
    totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
    projectsIncluded: Array.from(new Set(conversations.flatMap(conv => conv.projectIds))),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Main export function that delegates to format-specific functions
 */
export function exportConversations(
  conversations: ChatConversation[],
  options: ChatExportOptions
): string {
  switch (options.format) {
    case 'csv':
      return exportToCSV(conversations, options);
    case 'txt':
      return exportToTXT(conversations, options);
    case 'json':
      return exportToJSON(conversations, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Generate a filename for the export based on options and content
 */
export function generateExportFilename(
  conversations: ChatConversation[],
  options: ChatExportOptions
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const conversationCount = conversations.length;
  const messageCount = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

  let baseName = 'chat-export';

  // Add conversation context if single conversation
  if (options.conversationId && conversations.length === 1) {
    const conversation = conversations[0];
    const titlePart = conversation.title
      ? conversation.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
      : conversation.projectNames.join('-').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
    baseName = `chat-${titlePart}`;
  } else {
    baseName = `chat-export-${conversationCount}convos-${messageCount}msgs`;
  }

  return `${baseName}-${timestamp}.${options.format}`;
}

/**
 * Create and trigger download of chat export
 */
export function downloadChatExport(
  conversations: ChatConversation[],
  options: ChatExportOptions
): void {
  try {
    const content = exportConversations(conversations, options);
    const filename = generateExportFilename(conversations, options);
    
    const mimeTypes = {
      csv: 'text/csv',
      txt: 'text/plain',
      json: 'application/json',
    };

    const blob = new Blob([content], {
      type: mimeTypes[options.format] + ';charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chat:', error);
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ChatExportOptions): string[] {
  const errors: string[] = [];

  if (!['csv', 'txt', 'json'].includes(options.format)) {
    errors.push('Invalid format. Must be csv, txt, or json.');
  }

  return errors;
}

/**
 * Create default export options
 */
export function createDefaultExportOptions(format: 'csv' | 'txt' | 'json' = 'json'): ChatExportOptions {
  return {
    format,
    includeMetadata: true,
    includeSources: true,
    includeTimestamps: true,
  };
}

/**
 * Get export statistics for conversations
 */
export function getExportStatistics(conversations: ChatConversation[]) {
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  const userMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.filter(msg => msg.type === 'user').length,
    0
  );
  const assistantMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.filter(msg => msg.type === 'assistant').length,
    0
  );
  const totalSources = conversations.reduce(
    (sum, conv) => sum + conv.messages.reduce(
      (msgSum, msg) => msgSum + (msg.sources?.length || 0),
      0
    ),
    0
  );
  const uniqueProjects = Array.from(new Set(conversations.flatMap(conv => conv.projectIds)));
  const dateRange = conversations.length > 0 ? {
    earliest: new Date(Math.min(...conversations.map(conv => conv.createdAt.getTime()))),
    latest: new Date(Math.max(...conversations.map(conv => conv.updatedAt.getTime()))),
  } : null;

  return {
    conversationCount: conversations.length,
    totalMessages,
    userMessages,
    assistantMessages,
    systemMessages: totalMessages - userMessages - assistantMessages,
    totalSources,
    uniqueProjectCount: uniqueProjects.length,
    uniqueProjects,
    dateRange,
  };
} 