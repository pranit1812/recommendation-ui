# Product Requirements Document: Interactive Chatbot & API-Based Project Management

## Introduction/Overview

This feature adds two key capabilities to the BidBoard Test Harness:

1. **Interactive Chatbot Interface**: A dedicated chat page where users can have natural conversations with project documents, receiving AI responses with full metadata and clickable source references that navigate to specific PDF pages.

2. **API-Based Project Management**: Integration with the HyperWaterBids API to automatically fetch available ITB projects, replacing manual project ID entry with a user-friendly interface showing project names and document counts.

**Problem Solved**: Currently, users must manually configure project IDs and can only interact with documents through structured question packs. This limits flexibility and discoverability. The new features enable natural document exploration and streamlined project setup.

**Goal**: Provide an intuitive, chat-based interface for document interaction while simplifying project configuration through API integration.

## Goals

1. **Enable Natural Document Interaction**: Users can ask free-form questions about project documents in a conversational interface
2. **Maintain Source Traceability**: All AI responses include metadata with clickable references to exact PDF pages
3. **Support Multi-Project Conversations**: Users can ask the same questions across multiple projects using tabs or similar UI patterns
4. **Streamline Project Setup**: Replace manual project ID entry with API-driven project selection showing names and document counts
5. **Preserve Existing Functionality**: Maintain backward compatibility with current test runner and manual project management
6. **Enable Chat Export**: Provide downloadable chat history for documentation purposes

## User Stories

### Chatbot Interface
- **As a project manager**, I want to ask natural questions about project documents so that I can quickly find specific information without creating formal question packs
- **As a bid reviewer**, I want to see exactly which PDF page contains the information I'm looking for so that I can verify the AI's response
- **As a consultant**, I want to ask the same question across multiple projects so that I can compare requirements and specifications
- **As a documentation specialist**, I want to download chat conversations so that I can include them in project reports

### API Project Management  
- **As a system administrator**, I want to fetch projects from our central API so that I don't have to manually maintain project lists
- **As a user**, I want to see project names instead of UUIDs so that I can easily identify which project to work with
- **As a project coordinator**, I want to see how many documents are available for each project so that I can verify completeness before testing

## Functional Requirements

### Chatbot Interface (FR-CHAT)

**FR-CHAT-01**: The system must provide a dedicated chat page accessible via `/chat` route
**FR-CHAT-02**: The system must allow users to select one or more projects before starting a chat session
**FR-CHAT-03**: The system must support tabbed interface for multiple simultaneous project conversations
**FR-CHAT-04**: The system must send user messages to the GraphRAG API using the same `queryGraphRAG` function as existing test runner
**FR-CHAT-05**: The system must parse and display all available metadata from AI responses (filename, human_readable, page_num, sheet_number, section)
**FR-CHAT-06**: The system must render clickable source references using the existing `SourceReference` component
**FR-CHAT-07**: The system must open PDF documents in new windows with exact page navigation when source references are clicked
**FR-CHAT-08**: The system must preserve chat history within the session (no persistence required between browser sessions)
**FR-CHAT-09**: The system must provide a "Download Chat History" button that exports conversation as PDF or text file
**FR-CHAT-10**: The system must handle loading states during AI response generation
**FR-CHAT-11**: The system must display error messages when GraphRAG API calls fail
**FR-CHAT-12**: The system must support markdown rendering in AI responses for better formatting

### API Project Management (FR-API)

**FR-API-01**: The system must fetch project data from `https://dev-api.hyperwaterbids.com/api/itbs` endpoint
**FR-API-02**: The system must display project names instead of UUIDs in all project selection interfaces  
**FR-API-03**: The system must show document count for each project when available
**FR-API-04**: The system must add an "API Projects" section to the existing Admin → Projects page
**FR-API-05**: The system must maintain existing manual project entry alongside API-fetched projects
**FR-API-06**: The system must handle API errors gracefully with appropriate user feedback
**FR-API-07**: The system must implement manual refresh button for API project list
**FR-API-08**: The system must support pagination if the API returns large numbers of projects
**FR-API-09**: The system must filter API projects to show only those with document counts > 0 by default
**FR-API-10**: The system must allow users to toggle between API projects and manually entered projects

### Integration Requirements (FR-INT)

**FR-INT-01**: The system must use existing authentication/password protection for chat page
**FR-INT-02**: The system must maintain existing navigation structure with chat page added to main menu
**FR-INT-03**: The system must use existing environment variables for API endpoints (`APP_API_URL`, `APP_QUERY_API_URL`)
**FR-INT-04**: The system must integrate with existing `useProjects` hook or create similar pattern for API projects
**FR-INT-05**: The system must maintain existing PDF URL construction and S3 bucket configuration

## Non-Goals (Out of Scope)

1. **Persistent Chat Storage**: Chat conversations will not be saved between browser sessions
2. **Real-time Collaboration**: Multiple users cannot share the same chat session
3. **Advanced Chat Features**: No support for message editing, deletion, or threading
4. **Custom API Authentication**: Will use existing public endpoint without additional auth layers
5. **Project Creation**: Users cannot create new projects through the API integration
6. **Document Upload**: No functionality to upload documents through the chat interface
7. **AI Model Configuration**: No options to change or configure the underlying GraphRAG model

## Design Considerations

### Chat Interface Layout
- **Header**: Project selector with tabs for active conversations
- **Message Area**: Scrollable conversation with user messages (right-aligned) and AI responses (left-aligned)
- **Input Area**: Text input with send button and loading indicator
- **Sidebar**: Source references panel showing all cited documents from current conversation

### API Projects Integration
- **Dual Mode Interface**: Toggle between "Manual Projects" and "API Projects" in admin section
- **Enhanced Project Cards**: Display project name, UUID, document count, and last updated date
- **Loading States**: Skeleton loading for API calls with retry mechanisms

### Source Reference Enhancement
- **Metadata Badges**: Show page number, section, and confidence indicators
- **Quick Preview**: Hover tooltips with document type and brief description
- **Batch Actions**: Ability to open multiple sources in separate tabs

## Technical Considerations

### API Integration
- **Endpoint**: Use `APP_API_URL` from environment with `/itbs` path
- **Error Handling**: Implement retry logic with exponential backoff for API failures
- **Caching**: Consider localStorage caching for API project list to reduce calls
- **Type Safety**: Create TypeScript interfaces for API response structures

### Chat Implementation
- **State Management**: Use React state or Zustand for chat message management
- **Performance**: Implement message virtualization for very long conversations
- **Network**: Optimize API calls by reusing connections and implementing request queuing

### PDF Integration
- **URL Construction**: Extend existing `buildPDFUrl` function from `SourceReference` component
- **Page Navigation**: Ensure compatibility with various PDF viewers (browser built-in, external)
- **Error Recovery**: Handle cases where PDF links are broken or pages don't exist

## Success Metrics

1. **User Engagement**: Increase in document interaction time by 40% within 3 months
2. **Setup Efficiency**: Reduce project configuration time from 5 minutes to 30 seconds
3. **Source Verification**: 90% of users successfully navigate to source documents when clicking references
4. **API Reliability**: 99% uptime for project fetching with < 2 second response times
5. **User Satisfaction**: 85% of users prefer chat interface over structured question packs for exploratory queries

## Open Questions

1. **Chat Export Format**: Should chat history be exported as PDF, plain text, or both options?
2. **Multi-Project Chat UX**: Tabs vs. dropdown vs. sidebar for managing multiple project conversations?
3. **API Rate Limiting**: Are there any rate limits on the HyperWaterBids API that we need to handle?
4. **Document Count Source**: Does the API provide document counts, or do we need to query separately?
5. **Project Filtering**: Should we show all projects or only those with documents uploaded?
6. **Offline Behavior**: How should the system behave when API is unavailable - fallback to manual only?
7. **Response Streaming**: Should AI responses be streamed in real-time or delivered as complete messages? 