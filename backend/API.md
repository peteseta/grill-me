# Grill-Me API Documentation

Base URL: `http://localhost:3001`

## Table of Contents

- [Health Check](#health-check)
- [Session Management](#session-management)
  - [Create Session](#create-session)
  - [Get Session Details](#get-session-details)
  - [Update Session Status](#update-session-status)
- [Transcript Management](#transcript-management)
  - [Add Transcript Message](#add-transcript-message)
  - [Get Transcript](#get-transcript)
- [Interview Features](#interview-features)
  - [Lifeline (Get AI Advice)](#lifeline-get-ai-advice)
  - [Analyze Interview](#analyze-interview)
  - [Get Feedback](#get-feedback)

---

## Health Check

### `GET /health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200` - Success

---

## Session Management

### Create Session

### `POST /api/sessions/create`

Creates a new interview session by analyzing a resume against a job description.

**Request:**

Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume_file` | File | Yes | Resume file (PDF, DOCX, or TXT). Max size: 5MB |
| `job_description` | String | Yes | Job description text or URL to job posting |
| `role_title` | String | No | Title of the role (e.g., "Senior Software Engineer") |
| `company_name` | String | No | Name of the company (defaults to "Unknown Company") |

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "attack_plan": {
    "candidate_name": "John Doe",
    "role_title": "Senior Software Engineer",
    "difficulty_progression": "gradual",
    "overall_strategy": "Focus on technical depth in distributed systems...",
    "focus_areas": [
      {
        "area": "Technical Depth",
        "topic": "The 'Mango' Project",
        "context": "Why are we asking this?",
        "angle": "The specific doubt or skepticism to explore",
        "probing_questions": [
          "Question 1",
          "Question 2"
        ]
      }
    ],
    "behavioral_themes": [
      "Theme 1",
      "Theme 2"
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing required fields (resume_file or job_description)
- `500` - Server error (OpenAI API error, parsing error, etc.)

**Example (cURL):**
```bash
curl -X POST http://localhost:3001/api/sessions/create \
  -F "resume_file=@/path/to/resume.pdf" \
  -F "job_description=Seeking a senior engineer with 5+ years..." \
  -F "role_title=Senior Software Engineer" \
  -F "company_name=TechCorp"
```

---

### Get Session Details

### `GET /api/sessions/:sessionId`

Retrieves basic information about a session (without the attack plan).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID returned from create |

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "role_title": "Senior Software Engineer",
  "status": "in_progress",
  "created_at": 1700000000000,
  "completed_at": 1700003600000
}
```

**Session Status Values:**
- `setup` - Session created, not started
- `in_progress` - Interview in progress
- `paused` - Interview paused
- `completed` - Interview completed

**Status Codes:**
- `200` - Success
- `404` - Session not found

---

### Update Session Status

### `POST /api/sessions/:sessionId/status`

Updates the status of an interview session.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Valid Status Values:**
- `setup`
- `in_progress`
- `paused`
- `completed`

**Response:**
```json
{
  "success": true,
  "status": "in_progress"
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found

---

## Transcript Management

### Add Transcript Message

### `POST /api/sessions/:sessionId/transcript`

Adds a new message to the interview transcript.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Request Body:**
```json
{
  "speaker": "interviewer",
  "content": "Tell me about your experience with distributed systems."
}
```

**Speaker Values:**
- `interviewer` - Message from the AI interviewer
- `candidate` - Message from the candidate

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "speaker": "interviewer",
    "content": "Tell me about your experience with distributed systems.",
    "timestamp": 1700000000000
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found

---

### Get Transcript

### `GET /api/sessions/:sessionId/transcript`

Retrieves the full interview transcript for a session.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Response:**
```json
{
  "transcript": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "speaker": "interviewer",
      "content": "Tell me about your experience with distributed systems.",
      "timestamp": 1700000000000
    },
    {
      "id": "987fcdeb-51a2-43c7-b901-123456789abc",
      "speaker": "candidate",
      "content": "I've worked extensively with microservices architecture...",
      "timestamp": 1700000030000
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found

---

## Interview Features

### Lifeline (Get AI Advice)

### `POST /api/sessions/:sessionId/lifeline`

Provides real-time strategic advice to the candidate during the interview. The AI analyzes recent conversation context to provide actionable guidance.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Response:**
```json
{
  "advice": {
    "subtext": "The interviewer wants to understand your decision-making process under pressure",
    "strategy": [
      "Use STAR method: Situation, Task, Action, Result",
      "Mention specific metrics or outcomes",
      "Show self-awareness about what you learned"
    ],
    "avoid": [
      "Don't blame others or make excuses",
      "Avoid vague generalizations"
    ]
  },
  "context": [
    {
      "id": "...",
      "speaker": "interviewer",
      "content": "...",
      "timestamp": 1700000000000
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - OpenAI API not configured or error

**Note:** Uses the last 5 messages from the transcript for context.

---

### Analyze Interview

### `POST /api/sessions/:sessionId/analyze`

Analyzes the complete interview transcript and generates comprehensive feedback. This automatically updates the session status to `completed`.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Response:**
```json
{
  "overall_score": 7.5,
  "bullshit_meter": 35,
  "waffle_score": 42,
  "summary": "The candidate demonstrated strong technical knowledge but struggled with specific implementation details...",
  "strengths": [
    "Clear communication style",
    "Strong understanding of system design principles",
    "Good use of specific examples"
  ],
  "weaknesses": [
    "Vague metrics in several answers",
    "Difficulty articulating trade-offs",
    "Limited awareness of edge cases"
  ],
  "detailed_feedback": {
    "technical": "The candidate showed good understanding of...",
    "communication": "Communication was generally clear, but...",
    "behavioral": "Behavioral responses could be stronger by..."
  }
}
```

**Scoring Metrics:**
- `overall_score`: 1-10 scale (higher is better)
- `bullshit_meter`: 0-100 scale (higher means more BS detected)
- `waffle_score`: 0-100 scale (higher means more rambling)

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - OpenAI API not configured or error

**Note:** The feedback is automatically stored in the session and can be retrieved later using the `/feedback` endpoint.

---

### Get Feedback

### `GET /api/sessions/:sessionId/feedback`

Retrieves previously generated feedback for a session.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | UUID | Yes | The session ID |

**Response:**
Same format as the Analyze Interview response.

**Status Codes:**
- `200` - Success
- `404` - Session not found OR feedback not yet generated

**Note:** You must call `/analyze` endpoint first to generate feedback.

---

## Error Responses

All endpoints may return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common error scenarios:
- Invalid session ID → 404
- Missing required fields → 400
- OpenAI API errors → 500
- File parsing errors → 500

---

## Data Models

### Session

```typescript
interface Session {
  id: string;
  role_title: string;
  job_description: string;
  resume_text: string;
  attack_plan: any;
  transcript: TranscriptMessage[];
  status: 'setup' | 'in_progress' | 'paused' | 'completed';
  created_at: number;
  completed_at?: number;
  feedback?: any;
}
```

### TranscriptMessage

```typescript
interface TranscriptMessage {
  id: string;
  speaker: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
}
```

---

## Implementation Notes

### File Upload Limits
- Maximum file size: 5MB
- Supported formats: PDF, DOCX, TXT

### Resume Parsing
- PDF files are parsed using `pdf-parse`
- DOCX files are parsed using `mammoth`
- Text files are read directly

### Job Description Processing
- If the `job_description` field is a valid URL (starting with http/https), the API will scrape the page content
- HTML tags (scripts, styles, nav, header, footer) are removed automatically
- Plain text job descriptions are accepted as-is

### Storage
**Important:** The current implementation uses in-memory storage (`Map`). All data is lost when the server restarts. For production use, integrate a persistent database.

### OpenAI Integration
- Model used: `gpt-4o`
- API key required via `OPENAI_API_KEY` environment variable
- Attack plan generation uses structured outputs with JSON schema
- Analysis and lifeline features use JSON object response format

---

## Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
PORT=3001  # Default: 3001
```

---

## Example Workflow

1. **Create a session:**
   ```bash
   POST /api/sessions/create
   # Returns session_id and attack_plan
   ```

2. **Start the interview:**
   ```bash
   POST /api/sessions/:sessionId/status
   # body: { "status": "in_progress" }
   ```

3. **Record conversation:**
   ```bash
   POST /api/sessions/:sessionId/transcript
   # Add interviewer and candidate messages
   ```

4. **Get help (optional):**
   ```bash
   POST /api/sessions/:sessionId/lifeline
   # Returns strategic advice based on recent context
   ```

5. **Complete and analyze:**
   ```bash
   POST /api/sessions/:sessionId/analyze
   # Generates comprehensive feedback
   ```

6. **Retrieve feedback:**
   ```bash
   GET /api/sessions/:sessionId/feedback
   # Returns stored analysis
   ```
