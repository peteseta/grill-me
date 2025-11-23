# Grill Me API - Cloudflare Worker

This is the backend API for the Grill Me mock interview application, built as a Cloudflare Worker.

## Project Structure

```
workers/
├── src/
│   ├── index.ts              # Main entry point and router
│   ├── routes/               # API route handlers
│   │   ├── sessions.ts       # Session creation and listing
│   │   ├── session-config.ts # ElevenLabs configuration
│   │   ├── lifeline.ts       # Real-time assistance
│   │   └── analyze.ts        # Interview analysis and results
│   ├── services/             # Business logic and external integrations
│   │   ├── resume-parser.ts  # Resume parsing with LLM
│   │   ├── attack-plan-generator.ts # Interview strategy generation
│   │   ├── lifeline.ts       # Real-time advice generation
│   │   ├── elevenlabs.ts     # ElevenLabs API integration
│   │   └── interview-analyzer.ts # Interview analysis with LLM
│   ├── utils/                # Utility functions
│   │   ├── supabase.ts       # Supabase client setup
│   │   └── response.ts       # HTTP response helpers
│   └── types/                # TypeScript type definitions
│       ├── api.ts            # API request/response types
│       ├── database.ts       # Database schema types
│       ├── env.ts            # Environment bindings
│       └── index.ts          # Type exports
├── package.json
├── tsconfig.json
├── wrangler.toml            # Cloudflare Worker configuration
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Configure Environment Variables

Set your environment secrets using Wrangler:

```bash
# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# ElevenLabs
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put ELEVENLABS_AGENT_ID

# LLM APIs (choose at least one)
wrangler secret put OPENAI_API_KEY      # For GPT-4o
wrangler secret put ANTHROPIC_API_KEY   # For Claude Sonnet
wrangler secret put GOOGLE_API_KEY      # For Gemini
```

### 3. Run Development Server

```bash
npm run dev
```

This starts the Worker locally at `http://localhost:8787`

### 4. Deploy to Production

```bash
npm run deploy
```

## API Endpoints

### Session Management

#### `POST /api/v1/sessions`
Create a new interview session with resume and job description.

**Request**: `multipart/form-data`
- `resume`: File
- `job_description_text`: String
- `user_id`: UUID
- `interview_type`: "Technical" | "Behavioral" | "Mixed"
- `role_title`: String (optional)
- `company_name`: String (optional)

**Response**: `201 Created`
```json
{
  "session_id": "uuid",
  "status": "ready"
}
```

#### `GET /api/v1/sessions?user_id={uuid}`
List all sessions for a user.

**Response**: `200 OK`
```json
[
  {
    "session_id": "uuid",
    "created_at": "ISO timestamp",
    "role_title": "Product Manager",
    "company_name": "Microsoft",
    "status": "completed",
    "scores": {
      "score_overall": 7,
      "score_bullshit": 65
    }
  }
]
```

### Interview Configuration

#### `GET /api/v1/sessions/{session_id}/config`
Get ElevenLabs configuration for starting the interview.

**Response**: `200 OK`
```json
{
  "agent_id": "elevenlabs_agent_id",
  "dynamic_variables": {
    "ROLE_TITLE": "Product Manager",
    "CANDIDATE_NAME": "Pete",
    "COMPANY_NAME": "Microsoft",
    "INTERVIEW_TYPE": "Mixed",
    "ATTACK_PLAN_JSON": { ... },
    "RESUME_TEXT": "..."
  }
}
```

### Real-time Assistance

#### `POST /api/v1/sessions/{session_id}/lifeline`
Get real-time advice during the interview.

**Request**: `application/json`
```json
{
  "transcript_history": [
    { "role": "agent", "text": "Why did you build this?" },
    { "role": "user", "text": "Uhh, well I thought..." }
  ]
}
```

**Response**: `200 OK`
```json
{
  "advice": "The interviewer is testing your 'Build vs Buy' judgment...",
  "suggested_opening": "I evaluated off-the-shelf tools, but..."
}
```

### Interview Analysis

#### `POST /api/v1/sessions/{session_id}/analyze`
Analyze the interview and generate feedback.

**Request**: `application/json`
```json
{
  "conversation_id": "elevenlabs_conversation_id"
}
```

**Response**: `200 OK`
```json
{
  "session_id": "uuid",
  "metrics": {
    "score_overall": 7,
    "score_bullshit": 65,
    "score_technical": 80
  },
  "summary_feedback": "Strong technical foundation...",
  "full_transcript_json": [ ... ],
  "structured_feedback": [ ... ]
}
```

#### `GET /api/v1/sessions/{session_id}/results`
Get cached analysis results.

**Response**: Same as `/analyze` endpoint

## Implementation TODO List

Each route handler and service has detailed TODO comments indicating what needs to be implemented. Here's the high-level task breakdown:

### Route Handlers (`src/routes/`)
- [ ] Implement multipart form parsing in `sessions.ts`
- [ ] Implement session creation with resume parsing and attack plan generation
- [ ] Implement session listing with score joins
- [ ] Implement session config retrieval
- [ ] Implement lifeline endpoint
- [ ] Implement analysis endpoint with ElevenLabs integration
- [ ] Implement results retrieval endpoint

### Services (`src/services/`)
- [ ] **Resume Parser**: Extract text from PDF/DOCX, use LLM to structure data
- [ ] **Attack Plan Generator**: Analyze resume + job description, generate focus areas
- [ ] **Lifeline**: Generate real-time tactical advice
- [ ] **ElevenLabs Integration**: Fetch transcripts and audio URLs
- [ ] **Interview Analyzer**: Analyze transcript, generate scores and structured feedback

### Additional Tasks
- [ ] Add input validation (use Zod or similar)
- [ ] Add error handling and logging
- [ ] Add rate limiting
- [ ] Add authentication/authorization
- [ ] Set up R2 bucket for audio storage (optional)
- [ ] Set up KV cache for session data (optional)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Configure CORS for production domains

## Development Guidelines

### Error Handling
Always wrap async operations in try-catch blocks and return appropriate error responses.

### Type Safety
All functions should be fully typed. Use the types defined in `src/types/`.

### Database Operations
Use the Supabase client from `src/utils/supabase.ts`. Always handle errors from database operations.

### LLM Calls
- Use streaming where possible for better UX
- Set appropriate timeouts (30s max for Cloudflare Workers)
- Handle rate limits and retries
- Log token usage for cost tracking

### Testing
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [ElevenLabs API](https://elevenlabs.io/docs/api-reference/overview)
