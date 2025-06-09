import { Question, Source } from './types';

export function buildPrompt(question: Question): string {
  let prompt = question.text;
  
  // For number questions, embed the threshold in the prompt
  if (question.type === 'number' && question.threshold !== undefined && question.comparator) {
    prompt += ` (return only the number). Does it meet ${question.comparator} ${question.threshold}?`;
  }
  
  // For boolean questions, request yes/no + reason format
  if (question.type === 'boolean') {
    prompt += ` Please answer in the format: "Yes/No - [reason]" where the reason explains why.`;
  }
  
  // For lookup questions, also request reasoning
  if (question.type === 'lookup') {
    prompt += ` Please provide your answer followed by the reasoning: "[answer] - [reason why]"`;
  }
  
  return `${prompt}

Please provide specific document references with page numbers and section numbers where applicable.

Please provide a clear, natural response fit for a chatbot widget to the question. Only provide explanation and sources for up to a maximum of 2 of the BEST, MOST RELEVANT sources. Do not say things like Introduction to Site Plans or provide multiple sections. One concise response. After your response, include source metadata in the following format for each source used:

\`\`\`metadata
filename: [filename] human_readable: [human readable] page_num: [page num] sheet_number: [sheet_number] section: [section reference if applicable]
\`\`\`

Ensure each source has at least filename and human_readable fields but try to provide as much source information as possible.`;
}

export async function queryGraphRAG(projectId: string, query: string): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPH_RAG || 'https://query-mod-dev.hyperwaterbids.com/query';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itb_id: projectId,
      method: 'basic',
      query: query
    })
  });
  
  if (!response.ok) {
    throw new Error(`GraphRAG API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.response || data.answer || '';
}

// Helper function to convert technical filenames to human-readable names
function makeHumanReadable(filename: string): string {
  if (!filename) return 'Unknown Document';
  
  // Remove file extension
  let name = filename.replace(/\.(pdf|dwg|doc|docx)$/i, '');
  
  // Handle common patterns - order matters, most specific first
  const patterns = [
    // Architectural/MEP Plans - handle underscore variations
    { regex: /Arch[_\s]*MEP[_\s]*Plans/i, replacement: 'Architectural & MEP Plans' },
    { regex: /MEP[_\s]*Plans/i, replacement: 'MEP Plans' },
    { regex: /Arch[_\s]*Plans/i, replacement: 'Architectural Plans' },
    { regex: /Civil[_\s]*Plans/i, replacement: 'Civil Plans' },
    { regex: /Structural[_\s]*Plans/i, replacement: 'Structural Plans' },
    
    // Specifications with various formats
    { regex: /.*Specs?.*03.*Concrete/i, replacement: 'Division 03 - Concrete Specifications' },
    { regex: /.*Specs?.*04.*Masonry/i, replacement: 'Division 04 - Masonry Specifications' },
    { regex: /.*Specs?.*22.*Plumbing/i, replacement: 'Division 22 - Plumbing Specifications' },
    { regex: /.*Specs?.*26.*Electrical/i, replacement: 'Division 26 - Electrical Specifications' },
    
    // General document types
    { regex: /.*[_\s]?Plans[_\s]?Rev/i, replacement: 'Project Plans' },
    { regex: /.*[_\s]?Drawings[_\s]?/i, replacement: 'Project Drawings' },
    { regex: /.*[_\s]?Specs?[_\s]?/i, replacement: 'Project Specifications' },
    
    // Clean up revision info first
    { regex: /[_\s]*Rev[._\s]*\d{4}[-_]\d{2}[-_]\d{2}/gi, replacement: '' },
    { regex: /[_\s]*\d{4}[-_]\d{2}[-_]\d{2}/gi, replacement: '' },
    
    // Clean up underscores and extra spaces
    { regex: /_+/g, replacement: ' ' },
    { regex: /\s+/g, replacement: ' ' },
  ];
  
  for (const pattern of patterns) {
    name = name.replace(pattern.regex, pattern.replacement);
  }
  
  // Final cleanup and capitalize
  name = name.trim();
  if (name) {
    name = name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  return name || filename;
}

export function parseSources(response: string): { cleanResponse: string; sources: Source[] } {
  const sources: Source[] = [];
  let cleanText = response;

  // Look for ```metadata blocks (this is the main format)
  const metadataRegex = /```metadata\s+([\s\S]+?)```/g;
  let match;

  while ((match = metadataRegex.exec(response)) !== null) {
    const metadata = match[1];
    
    // Extract fields with regex
    const filename = /(?:filename|document_id):\s*([^\n]+)/i.exec(metadata)?.[1]?.trim();
    const humanReadable = /human_readable:\s*([^\n]+)/i.exec(metadata)?.[1]?.trim();
    const pageNum = /(?:page_num|page_number):\s*([^\n]+)/i.exec(metadata)?.[1]?.trim();
    const sheetNumber = /sheet_number:\s*([^\n]+)/i.exec(metadata)?.[1]?.trim();
    const section = /section:\s*([^\n]+)/i.exec(metadata)?.[1]?.trim();

    // Create source object with improved human-readable names
    const generatedHumanReadable = makeHumanReadable(filename || '');
    const source: Source = {
      filename: filename || 'Unknown Document',
      humanReadable: humanReadable || generatedHumanReadable,
      pageNum: pageNum ? parseInt(pageNum) || 0 : 0,
      sheetNumber: sheetNumber ? parseInt(sheetNumber) || 0 : 0,
      section: section || ''
    };



    if (source.filename && source.filename !== 'Unknown Document') {
      sources.push(source);
    }
  }

  // Remove metadata blocks from text
  cleanText = response.replace(metadataRegex, '').replace(/\n{3,}/g, '\n\n').trim();

  return { cleanResponse: cleanText, sources };
}

export function extractAnswer(response: string, type: Question['type']): string {
  const { cleanResponse } = parseSources(response);
  
  switch (type) {
    case 'number':
      // Extract first number found
      const numberMatch = cleanResponse.match(/\d+/);
      return numberMatch ? numberMatch[0] : '0';
      
    case 'boolean':
      // For boolean, return the full "Yes/No - reason" format
      // But also extract just yes/no for evaluation
      return cleanResponse.trim();
      
    case 'enum':
    case 'lookup':
    default:
      // Return the full response with reasoning
      const sentences = cleanResponse.split(/[.!?]/);
      const firstSentence = sentences[0]?.trim();
      return firstSentence && firstSentence.length > 0 
        ? (firstSentence.length > 200 ? firstSentence.substring(0, 200) + '...' : firstSentence)
        : cleanResponse.substring(0, 200);
  }
}

 