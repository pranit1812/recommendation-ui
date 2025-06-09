export interface CatalogItem {
  id: string;
  trade: string;
  text: string;
  type: 'number' | 'boolean' | 'enum' | 'lookup';
  requiresThreshold: boolean;
}

export interface Question {
  id: string;                    // uuid
  key: string;                   // catalog key OR "custom"
  text: string;                  // plain-english question
  type: 'boolean' | 'number' | 'enum' | 'lookup';
  threshold?: number;            // only for type:number
  comparator?: '>=' | '<=' | '>' | '<' | '=='; // num only
  expectedBoolean?: boolean;     // only for boolean
  expectedEnum?: string;         // only for enum
  critical: boolean;             // if true and fails => score 0
  weight: number;                // 0-10
}

export interface PackFilters {
  states: string[];          // multi-select dropdown from constant STATES
  markets: string[];         // multi-select dropdown from constant MARKETS
}

export interface QuestionPack {
  id: string;
  name: string;
  trades: string[];
  questions: Question[];
  filters: PackFilters;
  createdAt: Date;
}

export interface TestResult {
  questionId: string;
  question: string;
  answer: string;
  rawResponse: string;
  passed: boolean;
  sources: Source[];
  critical: boolean;
  weight: number;
}

export interface Source {
  filename: string;
  humanReadable: string;
  pageNum: number;
  sheetNumber: number;
  section: string;
}

export interface TestRun {
  id: string;
  packId: string;
  projectId: string;
  results: TestResult[];
  finalScore: number;
  baseScore: number;
  hasCriticalFail: boolean;
  verdict: 'Fail (critical)' | 'Bid' | 'Pass';
  completedAt: Date;
}

export interface SavedTestResult {
  id: string;                    // unique identifier for this saved result
  packId: string;               // which question pack was used
  packName: string;             // name of the pack for display
  projectId: string;            // which project was tested
  projectName: string;          // human readable project name
  testRun: TestRun;            // the complete test run data
  createdAt: Date;             // when this test was saved
}

// Moved to config/demoProjects.ts 