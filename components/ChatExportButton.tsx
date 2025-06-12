'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ChatConversation, ChatExportOptions } from '@/lib/types';
import { 
  downloadChatExport, 
  createDefaultExportOptions, 
  getExportStatistics,
  validateExportOptions 
} from '@/lib/chatExport';

interface ChatExportButtonProps {
  conversations: ChatConversation[];
  activeConversationId?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function ChatExportButton({
  conversations,
  activeConversationId,
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false
}: ChatExportButtonProps) {
  const [exportOptions, setExportOptions] = useState<ChatExportOptions>(
    createDefaultExportOptions('json')
  );
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportStatus, setLastExportStatus] = useState<'success' | 'error' | null>(null);

  // Determine which conversations to export
  const conversationsToExport = activeConversationId 
    ? conversations.filter(conv => conv.id === activeConversationId)
    : conversations;

  const stats = getExportStatistics(conversationsToExport);
  const hasConversations = conversationsToExport.length > 0;

  const handleExport = async (format: 'csv' | 'txt' | 'json') => {
    if (!hasConversations || isExporting) return;

    setIsExporting(true);
    setLastExportStatus(null);

    try {
      const options: ChatExportOptions = {
        ...exportOptions,
        format,
        conversationId: activeConversationId || undefined,
      };

      const validationErrors = validateExportOptions(options);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      downloadChatExport(conversationsToExport, options);
      setLastExportStatus('success');
    } catch (error) {
      console.error('Export failed:', error);
      setLastExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  const updateExportOption = (key: keyof ChatExportOptions, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    txt: FileText,
    json: FileJson,
  };

  const formatLabels = {
    csv: 'CSV Spreadsheet',
    txt: 'Plain Text',
    json: 'JSON Data',
  };

  const formatDescriptions = {
    csv: 'Structured data for Excel/Sheets',
    txt: 'Human-readable conversation format',
    json: 'Complete data with all metadata',
  };

  if (!hasConversations) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled={true}
        className={`gap-2 ${className}`}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled || isExporting}
          className={`gap-2 relative ${className}`}
        >
          <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">
            {isExporting ? 'Exporting...' : 'Export'}
          </span>
          
          {/* Status indicator */}
          {lastExportStatus === 'success' && (
            <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
          )}
          {lastExportStatus === 'error' && (
            <AlertCircle className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Chat History
        </DropdownMenuLabel>
        
        {/* Export Statistics */}
        <div className="px-2 py-3 text-xs text-muted-foreground border-b">
          <div className="grid grid-cols-2 gap-2">
            <div>Conversations: {stats.conversationCount}</div>
            <div>Messages: {stats.totalMessages}</div>
            <div>Projects: {stats.uniqueProjectCount}</div>
            <div>Sources: {stats.totalSources}</div>
          </div>
          {activeConversationId && (
            <div className="mt-2 text-primary text-xs">
              Exporting active conversation only
            </div>
          )}
        </div>

        {/* Format Selection */}
        <DropdownMenuLabel className="text-xs">Choose Format</DropdownMenuLabel>
        
        {(['json', 'csv', 'txt'] as const).map((format) => {
          const IconComponent = formatIcons[format];
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="flex items-start gap-3 p-3"
            >
              <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{formatLabels[format]}</span>
                  <Badge variant="secondary" className="text-xs">
                    .{format}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDescriptions[format]}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Export Options */}
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Settings className="h-3 w-3" />
          Export Options
        </DropdownMenuLabel>
        
        <DropdownMenuCheckboxItem
          checked={exportOptions.includeMetadata}
          onCheckedChange={(checked) => updateExportOption('includeMetadata', checked)}
          className="text-xs"
        >
          Include Metadata
          <span className="text-muted-foreground ml-1">(response times, models)</span>
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={exportOptions.includeSources}
          onCheckedChange={(checked) => updateExportOption('includeSources', checked)}
          className="text-xs"
        >
          Include Sources
          <span className="text-muted-foreground ml-1">(document references)</span>
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={exportOptions.includeTimestamps}
          onCheckedChange={(checked) => updateExportOption('includeTimestamps', checked)}
          className="text-xs"
        >
          Include Timestamps
          <span className="text-muted-foreground ml-1">(creation/update dates)</span>
        </DropdownMenuCheckboxItem>

        {/* Status Messages */}
        {lastExportStatus === 'success' && (
          <div className="px-2 py-2 text-xs text-green-600 bg-green-50 mx-1 rounded">
            ✓ Export completed successfully
          </div>
        )}
        
        {lastExportStatus === 'error' && (
          <div className="px-2 py-2 text-xs text-red-600 bg-red-50 mx-1 rounded">
            ✗ Export failed. Please try again.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ChatExportButton; 