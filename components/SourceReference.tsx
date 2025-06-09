import React from 'react';
import { Source } from '@/lib/types';

interface SourceReferenceProps {
  source: Source;
  itbId: string;
  onError?: (error: string) => void;
}

function buildPDFUrl(source: Source, itbId: string): string | null {
  if (!source.filename || !itbId) return null;

  // Clean up filename (remove any metadata)
  let filename = source.filename;
  
  // Remove metadata if present
  if (filename.includes('human_readable:')) {
    filename = filename.split('human_readable:')[0].trim();
  }
  if (filename.includes('page_num:')) {
    filename = filename.split('page_num:')[0].trim();
  }
  if (filename.includes('section:')) {
    filename = filename.split('section:')[0].trim();
  }

  // Environment-specific S3 bucket
  const bucket = process.env.NEXT_PUBLIC_CHAT_SOURCE_BUCKET || 'itb-store-dev';
  
  // Base URL format
  let url = `https://${bucket}.s3.us-east-2.amazonaws.com/itb-documents/${itbId}/${filename}`;

  // Add page fragment if available
  if (source.pageNum) {
    let pageNum = source.pageNum.toString();
    
    // Clean page number
    if (pageNum.includes('section:')) {
      pageNum = pageNum.split('section:')[0].trim();
    }
    if (pageNum.includes('sheet_number:')) {
      pageNum = pageNum.split('sheet_number:')[0].trim();
    }
    
    url += `#page=${pageNum}`;
  }

  return url;
}

const SourceReference: React.FC<SourceReferenceProps> = ({ source, itbId, onError }) => {
  const handleClick = () => {
    const url = buildPDFUrl(source, itbId);
    
    if (!url) {
      onError?.('Unable to construct PDF URL');
      return;
    }

    try {
      // Open PDF in new tab with page fragment
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening PDF:', error);
      onError?.(`Failed to open PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getDisplayName = () => {
    return source.humanReadable || source.filename || 'Unknown source';
  };

  const getSourceIcon = () => {
    const filename = source.filename?.toLowerCase() || '';
    if (filename.endsWith('.pdf')) return '📄';
    if (filename.endsWith('.dwg')) return '📐';
    if (filename.endsWith('.doc') || filename.endsWith('.docx')) return '📝';
    if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return '📊';
    return '📄';
  };

  const cleanPageNumber = (pageNum: number) => {
    if (!pageNum) return '';
    let pageStr = pageNum.toString();
    if (pageStr.includes('section:')) {
      pageStr = pageStr.split('section:')[0].trim();
    }
    if (pageStr.includes('sheet_number:')) {
      pageStr = pageStr.split('sheet_number:')[0].trim();
    }
    return pageStr;
  };

  const cleanSheetNumber = (sheetNum: number) => {
    if (!sheetNum) return '';
    let sheetStr = sheetNum.toString();
    if (sheetStr.includes('section:')) {
      sheetStr = sheetStr.split('section:')[0].trim();
    }
    return sheetStr;
  };

  return (
    <div 
      className="source-reference inline-block m-1 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="inline-flex items-start bg-blue-50 border border-blue-200 rounded-2xl px-3 py-1.5 text-xs text-blue-700 max-w-md transition-all duration-200 hover:bg-blue-100 hover:border-blue-300">
        <span className="mr-1.5">
          {getSourceIcon()}
        </span>
        <div className="flex flex-col">
          <div className="font-medium mb-1">
            {getDisplayName()}
          </div>
          {source.pageNum > 0 && (
            <div className="text-xs opacity-90">
              Page {cleanPageNumber(source.pageNum)}
            </div>
          )}
          {source.sheetNumber > 0 && (
            <div className="text-xs opacity-90">
              Sheet {cleanSheetNumber(source.sheetNumber)}
            </div>
          )}
          {source.section && (
            <div className="text-xs opacity-90">
              Section {source.section}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceReference; 