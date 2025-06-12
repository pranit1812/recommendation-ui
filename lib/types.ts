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

// API Project Types for HyperWaterBids Integration
export interface ApiProject {
  id: string;                   // ITB ID from API
  projectName: string;          // Project name from API
  jobNumber: string;            // Job number
  emailType: string;            // Email type (ITB)
  deliveryMethod?: string;      // Delivery method
  bidDue?: string;              // Bid due date (ISO string)
  preBidDue?: string;           // Pre-bid due date
  refisDue?: string;            // RFIs due date
  jobWalkDate?: string;         // Job walk date
  fullScope?: string;           // Full scope description
  gcName?: string;              // General contractor name
  gcContactName?: string;       // GC contact name
  gcContactTitle?: string;      // GC contact title
  gcContactEmail?: string;      // GC contact email
  gcContactPhone?: string;      // GC contact phone
  gcItbNotes?: string;          // GC ITB notes
  projectSize?: string;         // Project size
  projectStartDate?: string;    // Project start date
  projectDuration?: string;     // Project duration
  projectAddress?: string;      // Project address
  city?: string;                // City
  state?: string;               // State
  itbSoftwareLabel?: string;    // ITB software label
  itbSoftwareUrl?: string;      // ITB software URL
  marketSegment?: string;       // Market segment
  estimatedProcessingTime?: string; // Estimated processing time
  extractedAssets?: unknown;        // Extracted assets
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
  includedDocuments: unknown[];     // Array of included documents
  companySpecs?: unknown[];         // Company specifications
  purchaseInfo?: unknown[];         // Purchase information
}

export interface ApiProjectsResponse {
  data: ApiProject[];
  totalCount: number;
  skip: number;
  take: number;
}

export interface ApiProjectsParams {
  skip?: number;
  take?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
}

// Enhanced Project type that supports both manual and API projects
export interface Project {
  id: string;                   // Project ID (manual or API)
  name: string;                 // Display name
  source: 'manual' | 'api';     // Source of the project
  documentCount?: number;       // For API projects
  createdAt?: Date;             // Creation date
}

// Chat Message Types for Chatbot Feature
export interface ChatMessage {
  id: string;                   // Unique message ID
  type: 'user' | 'assistant' | 'system';
  content: string;              // Message content
  timestamp: Date;              // When the message was sent
  sources?: Source[];           // Source references for assistant messages
  metadata?: ChatMessageMetadata; // Additional message metadata
}

export interface ChatMessageMetadata {
  projectIds?: string[];        // Projects this message relates to
  responseTime?: number;        // Time taken to generate response (ms)
  tokensUsed?: number;          // Tokens consumed for this message
  model?: string;               // AI model used
  error?: string;               // Error message if request failed
}

export interface ChatConversation {
  id: string;                   // Unique conversation ID
  projectIds: string[];         // Projects included in this conversation
  projectNames: string[];       // Human-readable project names
  messages: ChatMessage[];      // All messages in chronological order
  createdAt: Date;              // When conversation started
  updatedAt: Date;              // Last message timestamp
  title?: string;               // Optional conversation title
}

export interface ChatState {
  conversations: Record<string, ChatConversation>; // Keyed by conversation ID
  activeConversationId: string | null;             // Currently active conversation
  isLoading: boolean;                               // Is a message being processed
  error: string | null;                             // Current error state
}

// Chat Export Types
export interface ChatExportOptions {
  format: 'csv' | 'txt' | 'json';
  includeMetadata: boolean;
  includeSources: boolean;
  includeTimestamps: boolean;
  conversationId?: string;      // If not provided, exports all conversations
}

export interface ChatExportData {
  conversations: ChatConversation[];
  exportedAt: Date;
  totalMessages: number;
  projectsIncluded: string[];
}