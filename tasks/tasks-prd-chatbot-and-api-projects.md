# Task List: Interactive Chatbot & API-Based Project Management

## Relevant Files

- `app/chat/page.tsx` - Main chat interface page component with project selection and conversation management
- `app/chat/page.test.tsx` - Unit tests for the chat page component
- `components/ChatInterface.tsx` - Core chat UI component handling message display and input
- `components/ChatInterface.test.tsx` - Unit tests for ChatInterface component
- `components/ProjectSelector.tsx` - Enhanced project selector supporting both API and manual projects
- `components/ProjectSelector.test.tsx` - Unit tests for ProjectSelector component
- `components/ChatHistory.tsx` - Component for displaying and managing chat conversation history
- `components/ChatHistory.test.tsx` - Unit tests for ChatHistory component
- `lib/useApiProjects.ts` - Custom hook for fetching and managing API-based projects
- `lib/useApiProjects.test.ts` - Unit tests for useApiProjects hook
- `lib/useChatHistory.ts` - Custom hook for managing chat state and history
- `lib/useChatHistory.test.ts` - Unit tests for useChatHistory hook
- `lib/chatExport.ts` - Utility functions for exporting chat history as PDF/text
- `lib/chatExport.test.ts` - Unit tests for chat export functionality
- `lib/types.ts` - Extended type definitions for chat messages and API project responses
- `app/layout.tsx` - Updated to include chat navigation link
- `components/ui/tabs.tsx` - New UI component for chat tabs (if not existing)
- `app/admin/projects/page.tsx` - Enhanced to include API projects section

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration
- The chat interface will reuse existing GraphRAG integration and SourceReference components
- API integration will extend the current project management system rather than replace it

## Tasks

- [x] 1.0 Create Chat Interface Foundation
  - [x] 1.1 Create `/app/chat/page.tsx` with basic page structure and password protection
  - [x] 1.2 Build `ProjectSelector` component that displays both manual and API projects
  - [x] 1.3 Create `ChatInterface` component with message display area and input field
  - [x] 1.4 Add tabs UI component for multi-project conversations
  - [x] 1.5 Implement responsive chat layout with proper styling using Tailwind CSS
  - [x] 1.6 Add loading states and error boundaries for the chat interface

- [x] 2.0 Implement API Project Management
  - [x] 2.1 Create TypeScript interfaces for API project response in `lib/types.ts`
  - [x] 2.2 Build `useApiProjects` hook to fetch projects from `/api/itbs` endpoint
  - [x] 2.3 Add error handling and retry logic for API failures
  - [x] 2.4 Implement project filtering (show only projects with documents > 0)
  - [x] 2.5 Add localStorage caching for API project data
  - [x] 2.6 Create toggle functionality between manual and API projects
  - [x] 2.7 Update admin projects page to display API projects section
  - [x] 2.8 Add manual refresh button for API project list

- [x] 3.0 Build Chat Functionality & Message Handling
  - [x] 3.1 Create `useChatHistory` hook for managing conversation state
  - [x] 3.2 Implement message sending functionality using existing `queryGraphRAG`
  - [x] 3.3 Add message parsing and metadata extraction using existing `parseSources`
  - [x] 3.4 Integrate `SourceReference` component for clickable document links
  - [x] 3.5 Add markdown rendering support for AI responses
  - [x] 3.6 Implement typing indicators and loading states during AI responses
  - [x] 3.7 Add error handling for failed GraphRAG API calls
  - [x] 3.8 Support multi-project conversations with tab switching
  - [x] 3.9 Add message timestamp display and conversation threading

- [x] 4.0 Add Chat Export Features
  - [x] 4.1 Create `chatExport.ts` utility for generating downloadable chat history
  - [x] 4.2 Implement csv export
  - [x] 4.3 Add plain text export option for chat conversations
  - [x] 4.4 Create download button component with export format selection
  - [x] 4.5 Add session-based chat history persistence (no database storage)
  - [x] 4.6 Add metadata inclusion in exported files (timestamps, project info, sources)

- [x] 5.0 Integration & Navigation Updates
  - [x] 5.1 Add "Chat" navigation link to main layout and navigation menu
  - [x] 5.2 Update existing project selection components to support dual project sources
  - [x] 5.3 Ensure chat page uses existing authentication/password protection
  - [x] 5.4 Add environment variable configuration for API endpoints
  - [x] 5.5 Update `useProjects` hook or create compatible pattern for API projects
  - [x] 5.6 Test integration with existing PDF URL construction and S3 bucket setup
  - [x] 5.7 Add comprehensive error handling and user feedback throughout the system
  - [x] 5.8 Verify backward compatibility with existing test runner functionality 