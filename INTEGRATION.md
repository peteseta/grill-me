# Frontend-Backend Integration Documentation

This document describes the integration between the frontend React application and the Cloudflare Workers backend API.

## Overview

The frontend has been integrated with the backend API to provide a complete end-to-end interview experience. All components now communicate with the backend to create sessions, fetch interview configurations, and retrieve analysis results.

## API Client

**Location:** `/lib/api-client.ts`

The API client provides a centralized interface for all backend communication. It includes methods for:

- **Session Management**
  - `createSession()` - Create new interview sessions
  - `listSessions()` - Fetch user's interview history
  - `getSessionConfig()` - Get ElevenLabs configuration

- **Interview Features**
  - `requestLifeline()` - Get real-time assistance
  - `analyzeSession()` - Trigger post-interview analysis
  - `getSessionResults()` - Retrieve cached analysis results

### Configuration

Set the API URL in your environment:

```bash
# .env
VITE_API_URL=http://localhost:8787  # for local development
# or
VITE_API_URL=https://your-worker.workers.dev  # for production
```

## User Management

**Location:** `/lib/user.ts`

Simple UUID-based user identification stored in localStorage. In production, this should be replaced with proper authentication.

```typescript
import { getUserId } from '../lib/user';

// Get or create user ID
const userId = getUserId();
```

## Component Integration

### 1. Upload Page (`components/upload-page.tsx`)

**Integrated Endpoint:** `POST /api/v1/sessions`

**Flow:**
1. User uploads resume, enters job description, role title, and company name
2. User selects interview type (Technical, Behavioral, or Mixed)
3. On "Start Interview" click:
   - Creates FormData with all fields
   - Calls `apiClient.createSession()`
   - Receives `session_id` in response
   - Passes session ID to parent component to start interview

**Key Changes:**
- Added state for role title and company name
- Added loading and error states
- Integrated with API client
- Shows loading spinner during session creation

### 2. History Page (`components/history-page.tsx`)

**Integrated Endpoint:** `GET /api/v1/sessions?user_id={uuid}`

**Flow:**
1. Component loads and fetches user's sessions from backend
2. Transforms API response to match UI format
3. Displays sessions with scores and status
4. Calculates statistics (total interviews, average score, completed count)

**Key Changes:**
- Replaced mock data with real API calls
- Added loading and error states
- Dynamic score calculation based on real data
- Handles both completed and in-progress interviews

### 3. Interview Page (`components/interview-page.tsx`)

**Integrated Endpoints:**
- `GET /api/v1/sessions/{session_id}/config`
- `POST /api/v1/sessions/{session_id}/lifeline` (prepared, not yet implemented)

**Flow:**
1. Component loads session configuration from backend
2. Displays interview details (role, company, type, candidate name)
3. Ready to integrate with ElevenLabs SDK
   - Agent ID and dynamic variables are fetched
   - ATTACK_PLAN_JSON needs to be stringified before passing to SDK
4. (Future) Will call lifeline endpoint for real-time assistance
5. (Future) Will call analyze endpoint after interview completion

**Key Changes:**
- Added session config loading
- Shows loading state while fetching config
- Displays interview details from backend
- Prepared for ElevenLabs integration with TODO comments
- Error handling with retry option

### 4. Interview Detail Page (`components/interview-detail.tsx`)

**Integrated Endpoints:**
- `GET /api/v1/sessions/{session_id}/results`
- `POST /api/v1/sessions/{session_id}/analyze`

**Status:** Ready for integration (component exists but needs backend data hookup)

The interview detail page will:
1. Load analysis results from backend
2. Display transcript with highlighted feedback
3. Show metrics (overall score, bullshit score, technical score)
4. Render structured feedback with exact quotes

## App.tsx Updates

**Key Changes:**
- Added `currentSessionId` state
- Pass session ID from upload page to interview page
- Updated `handleStartInterview` to accept session ID parameter

## Environment Setup

### Required Environment Variables

Create a `.env` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:8787

# ElevenLabs Configuration (optional - fetched from backend)
VITE_ELEVENLABS_API_KEY=your_key_here
```

## Data Flow

```
1. Upload Page
   └─> POST /api/v1/sessions
       └─> Returns session_id
           └─> Interview Page

2. Interview Page
   └─> GET /api/v1/sessions/{session_id}/config
       └─> Returns agent_id, dynamic_variables
           └─> Start ElevenLabs conversation
               └─> Get conversation_id
                   └─> POST /api/v1/sessions/{session_id}/analyze

3. History Page
   └─> GET /api/v1/sessions?user_id={uuid}
       └─> Returns list of sessions
           └─> Display interviews

4. Interview Detail
   └─> GET /api/v1/sessions/{session_id}/results
       └─> Returns cached analysis
           └─> Display feedback and metrics
```

## Next Steps

### ElevenLabs Integration

To complete the interview functionality, integrate the ElevenLabs Conversational AI SDK:

1. Install the SDK:
   ```bash
   npm install @11labs/client
   ```

2. Update `interview-page.tsx`:
   ```typescript
   import { Conversation } from '@11labs/client';

   // In loadSessionConfig()
   const conversation = new Conversation();
   await conversation.startSession({
     agentId: config.agent_id,
     dynamicVariables: {
       ...config.dynamic_variables,
       ATTACK_PLAN_JSON: JSON.stringify(config.dynamic_variables.ATTACK_PLAN_JSON, null, 2)
     }
   });

   // Store conversation_id for later use
   setConversationId(conversation.getId());
   ```

3. After interview completes, call analyze endpoint:
   ```typescript
   const analysis = await apiClient.analyzeSession(sessionId, {
     conversation_id: conversationId
   });
   ```

### Lifeline Feature

The lifeline endpoint is prepared but not yet implemented. To add:

1. Add a "Need Help?" button in interview page
2. On click, pause interview and collect transcript history
3. Call lifeline endpoint:
   ```typescript
   const help = await apiClient.requestLifeline(sessionId, {
     transcript_history: transcriptMessages
   });
   ```
4. Display advice and suggested opening to user

### Authentication

Replace the simple UUID system with proper authentication:

1. Implement user registration/login
2. Use JWT or session tokens
3. Update API client to include auth headers
4. Modify `getUserId()` to return authenticated user ID

## Testing

### Local Development

1. Start backend:
   ```bash
   cd workers
   npm run dev
   ```

2. Start frontend:
   ```bash
   npm run dev
   ```

3. Access at `http://localhost:5173` (or your Vite dev server port)

### Testing Checklist

- [ ] Upload resume and create session
- [ ] View session details in history
- [ ] Start interview and see config loaded
- [ ] Complete interview and trigger analysis
- [ ] View analysis results in history
- [ ] Error handling (network errors, validation errors)
- [ ] Loading states appear correctly

## API Response Examples

### Create Session Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ready"
}
```

### Session Config Response
```json
{
  "agent_id": "eleven_agent_xyz",
  "dynamic_variables": {
    "ROLE_TITLE": "Senior Frontend Engineer",
    "CANDIDATE_NAME": "John Doe",
    "COMPANY_NAME": "Google",
    "INTERVIEW_TYPE": "Technical",
    "ATTACK_PLAN_JSON": { ... },
    "RESUME_TEXT": "..."
  }
}
```

### Session List Response
```json
[
  {
    "session_id": "...",
    "created_at": "2025-11-23T10:00:00Z",
    "role_title": "Product Manager",
    "company_name": "Microsoft",
    "status": "completed",
    "scores": {
      "score_overall": 8,
      "score_bullshit": 45
    }
  }
]
```

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure the backend worker has CORS middleware configured (already done in `workers/src/index.ts`).

### API URL Not Found

Check that:
1. `.env` file exists with `VITE_API_URL`
2. Environment variables are loaded (restart dev server)
3. Backend worker is running

### User ID Issues

Clear localStorage to reset user ID:
```javascript
localStorage.removeItem('grill_me_user_id');
```

Or use the utility:
```typescript
import { clearUserId } from '../lib/user';
clearUserId();
```
