import * as XLSX from 'xlsx';
import { CatalogItem } from './types';
import { slugify } from './utils';

export async function parseCatalogFromFile(file: File): Promise<CatalogItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return parseCatalogFromWorkbook(workbook);
}

export async function parseCatalogFromUrl(url: string): Promise<CatalogItem[]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return parseCatalogFromWorkbook(workbook);
}

function parseCatalogFromWorkbook(workbook: XLSX.WorkBook): CatalogItem[] {
  const catalog: CatalogItem[] = [];
  
  // Get all sheet names
  const sheetNames = workbook.SheetNames;
  
  sheetNames.forEach((sheetName) => {
    // Skip sheets that don't look like trade divisions
    if (sheetName === 'ALL DIVISIONS' || sheetName.length < 2) {
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    
    // Find the column with questions (usually column C, index 2)
    // Look for rows that have content in column C
    data.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      
      const questionText = row[2]; // Column C (0-indexed)
      
      if (questionText && typeof questionText === 'string' && questionText.trim().length > 10) {
        const text = questionText.trim();
        
        // Determine question type based on content
        const requiresThreshold = text.includes('___') || text.includes('____');
        let type: CatalogItem['type'] = 'boolean';
        
        if (requiresThreshold) {
          type = 'number';
        } else if (text.toLowerCase().includes('what') || text.toLowerCase().includes('which')) {
          type = 'enum';
        } else if (text.toLowerCase().includes('where') || text.toLowerCase().includes('locate')) {
          type = 'lookup';
        }
        
        const catalogItem: CatalogItem = {
          id: `${slugify(sheetName)}-${index}`,
          trade: sheetName,
          text,
          type,
          requiresThreshold
        };
        
        catalog.push(catalogItem);
      }
    });
  });
  
  return catalog;
}

export function inferQuestionType(text: string): CatalogItem['type'] {
  const lowerText = text.toLowerCase();
  
  if (text.includes('___') || text.includes('____')) {
    return 'number';
  }
  
  if (lowerText.includes('what') || lowerText.includes('which') || lowerText.includes('list')) {
    return 'enum';
  }
  
  if (lowerText.includes('where') || lowerText.includes('locate') || lowerText.includes('address')) {
    return 'lookup';
  }
  
  return 'boolean';
} 