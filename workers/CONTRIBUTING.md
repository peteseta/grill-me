# Contributing to Grill Me API

This guide will help you implement the scaffolded API endpoints.

## Quick Start

1. **Install dependencies**:
   ```bash
   cd workers
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .dev.vars.example .dev.vars
   # Fill in your API keys in .dev.vars
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Choose a feature to implement** from the TODO list below

## Implementation Guide

### Phase 1: Core Session Management

#### 1.1 Resume Parsing (`src/services/resume-parser.ts`)

**Goal**: Extract text from resume files and parse structured information.

**Steps**:
1. Install PDF/DOCX parsing libraries (if needed for Workers environment)
2. Extract raw text from file
3. Send to LLM (GPT-4o or Claude) with a structured prompt
4. Parse response into `ParsedResume` format

**Example prompt**:
```
Extract the following information from this resume:
- Candidate name
- Email and phone
- Skills (as array)
- Work experience (company, title, duration, description)
- Education (institution, degree, year)

Return as JSON.
```

**Testing**:
```bash
# Upload a test resume via POST /api/v1/sessions
curl -X POST http://localhost:8787/api/v1/sessions \
  -F "resume=@test-resume.pdf" \
  -F "user_id=test-uuid" \
  -F "job_description_text=Senior PM role..." \
  -F "interview_type=Mixed"
```

#### 1.2 Attack Plan Generation (`src/services/attack-plan-generator.ts`)

**Goal**: Analyze resume and job description to create interview strategy.

**Steps**:
1. Construct comprehensive prompt with resume and job description
2. Ask LLM to identify:
   - Vague claims or buzzwords
   - Impressive metrics that need validation
   - Key skills for the role that should be tested
3. Generate 3-5 focus areas with probing questions
4. Parse response into `AttackPlan` format

**Example prompt**:
```
You are an expert technical interviewer. Analyze this resume against this job description.

Resume: [resume text]
Job Description: [job description]
Role: [role title]

Identify 3-5 focus areas to probe during the interview. For each:
1. Topic (e.g., "Mango Project scalability claims")
2. Context (why this is worth probing)
3. 2-3 probing questions

Focus on:
- Vague buzzwords that need clarification
- Impressive metrics that need validation
- Critical skills for this role

Return as JSON: { difficulty: "moderate", focus_areas: [...] }
```

#### 1.3 Session Creation (`src/routes/sessions.ts`)

**Goal**: Handle session creation with resume upload.

**Steps**:
1. Parse multipart form data (use Hono's built-in support)
2. Validate required fields
3. Call `parseResume()` service
4. Call `generateAttackPlan()` service
5. Insert into database
6. Return session_id

**Example**:
```typescript
const formData = await c.req.formData();
const resume = formData.get('resume') as File;
const jobDescription = formData.get('job_description_text') as string;
// ... validate and process
```

### Phase 2: Interview Execution

#### 2.1 Session Config (`src/routes/session-config.ts`)

**Goal**: Provide ElevenLabs with interview parameters.

**Steps**:
1. Fetch session from database
2. Extract attack_plan, resume_text, etc.
3. Parse candidate name from resume (simple heuristic is fine)
4. Return formatted response
5. Update session status to 'in_progress'

**Testing**:
```bash
curl http://localhost:8787/api/v1/sessions/{session_id}/config
```

#### 2.2 Lifeline Service (`src/services/lifeline.ts`)

**Goal**: Provide real-time tactical advice.

**Steps**:
1. Analyze last 3-5 messages of conversation
2. Identify what the interviewer is testing
3. Provide concise advice (1-2 sentences)
4. Suggest a strong opening line

**Example prompt**:
```
You are an interview coach. The candidate is stuck mid-answer.

Recent conversation:
[transcript history]

What is the interviewer really testing? Provide:
1. Tactical advice (1 sentence)
2. Suggested opening line to recover

Be concise and actionable.
```

**Requirements**:
- Must respond in < 2 seconds (use fast model like GPT-4o-mini or Claude Haiku)
- Keep advice short and specific

### Phase 3: Post-Interview Analysis

#### 3.1 ElevenLabs Integration (`src/services/elevenlabs.ts`)

**Goal**: Fetch transcript and audio from ElevenLabs.

**Steps**:
1. Make GET request to ElevenLabs API
2. Parse response
3. Transform to `TranscriptMessage[]` format
4. Fetch audio URL (may need to download and re-upload to R2)

**ElevenLabs API**:
```
GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}
Headers: xi-api-key: {ELEVENLABS_API_KEY}
```

#### 3.2 Interview Analyzer (`src/services/interview-analyzer.ts`)

**Goal**: Generate detailed feedback with highlighted quotes.

**Steps**:
1. Send full transcript to LLM
2. Ask for:
   - Overall score (1-10)
   - Bullshit score (0-100, high = bad)
   - Technical score (0-100, high = good)
   - Summary feedback
   - Structured feedback with exact quotes
3. Parse response into `AnalysisResult` format

**Example prompt**:
```
Analyze this mock interview transcript.

Transcript: [full transcript]
Role: [role title]
Type: [interview type]

Provide:
1. Scores:
   - score_overall (1-10)
   - score_bullshit (0-100, where 100 = maximum buzzword usage)
   - score_technical (0-100, where 100 = excellent technical depth)

2. Summary feedback (2-3 sentences)

3. Structured feedback: Highlight specific quotes from the candidate's responses
   For each highlight, provide:
   - target_message_index (which message in transcript)
   - exact_quote (exact text to highlight)
   - type ("positive" | "negative" | "warning")
   - category (e.g., "buzzword_stuffing", "concrete_metric")
   - feedback (what was good/bad about this)

Return as JSON.
```

**Important**: Ensure exact quotes match the transcript text exactly for frontend highlighting.

#### 3.3 Analysis Endpoint (`src/routes/analyze.ts`)

**Goal**: Orchestrate full analysis pipeline.

**Steps**:
1. Fetch session from database
2. Fetch transcript from ElevenLabs
3. Fetch audio URL from ElevenLabs
4. Call analyzer service
5. Insert into `interview_analyses` table
6. Update session status to 'completed'
7. Return analysis response

### Phase 4: Additional Features

#### 4.1 Session Listing (`src/routes/sessions.ts`)

**Goal**: Show user's interview history.

**Steps**:
1. Query sessions by user_id
2. Join with interview_analyses for scores
3. Return formatted list

**SQL Example**:
```typescript
const { data } = await supabase
  .from('interview_sessions')
  .select(`
    id,
    created_at,
    role_title,
    company_name,
    status,
    interview_analyses (score_overall, score_bullshit)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### 4.2 Results Retrieval (`src/routes/analyze.ts`)

**Goal**: Return cached analysis.

**Steps**:
1. Query `interview_analyses` by session_id
2. Return same format as analyze endpoint
3. Return 404 if not found

## Testing Strategy

### Unit Tests
Test individual services with mocked dependencies:
```typescript
// Example test for resume parser
describe('parseResume', () => {
  it('should extract candidate name from resume', async () => {
    const mockFile = new File(['...'], 'resume.pdf');
    const result = await parseResume(mockFile, mockEnv);
    expect(result.candidate_name).toBe('John Doe');
  });
});
```

### Integration Tests
Test full API endpoints:
```typescript
describe('POST /api/v1/sessions', () => {
  it('should create a session', async () => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('user_id', 'test-uuid');
    // ...
    const response = await app.request('/api/v1/sessions', {
      method: 'POST',
      body: formData,
    });
    expect(response.status).toBe(201);
  });
});
```

## Code Quality Guidelines

### Error Handling
```typescript
try {
  const result = await riskyOperation();
  return success(result);
} catch (error) {
  console.error('Operation failed:', error);
  return badRequest('Operation failed');
}
```

### Input Validation
Use Zod for request validation:
```typescript
import { z } from 'zod';

const createSessionSchema = z.object({
  user_id: z.string().uuid(),
  interview_type: z.enum(['Technical', 'Behavioral', 'Mixed']),
  // ...
});
```

### Logging
Log important events:
```typescript
console.log('Session created:', sessionId);
console.error('Failed to parse resume:', error);
```

### Type Safety
Always use types from `src/types/`:
```typescript
import { CreateSessionRequest, CreateSessionResponse } from '@/types/api';
```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Deploy to Cloudflare
npm run deploy

# Set production secrets
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
# ... etc
```

## Getting Help

- Check the TODO comments in each file
- Review the API.md documentation
- Look at the database schema in docs/SCHEMA.sql
- Check the flowchart in docs/FLOWCHART.png

## Implementation Priority

Recommended order:
1. Resume Parser → Attack Plan Generator → Session Creation
2. Session Config
3. Lifeline
4. ElevenLabs Integration → Interview Analyzer → Analysis Endpoint
5. Session Listing → Results Retrieval
