# Mock Interviewer App - Implementation Plan

## 🎯 Architecture Overview

### System Components

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │◄────►│   Backend    │◄────►│  LLM Services   │
│  (Next.js)  │      │  (FastAPI)   │      │  (GPT/Gemini)   │
└─────────────┘      └──────────────┘      └─────────────────┘
                             │
                             ▼
                     ┌──────────────┐      ┌─────────────────┐
                     │   Database   │      │ Voice Service   │
                     │  (Postgres)  │      │  (ElevenLabs)   │
                     └──────────────┘      └─────────────────┘
```

---

## 🛠 Tech Stack Recommendations

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Voice UI**: Custom audio player + waveform visualization
- **State Management**: React Context + Zustand (for complex state)
- **Real-time**: WebSockets or Server-Sent Events

### Backend
- **Framework**: FastAPI (Python) - best for LLM integrations
- **Language**: Python 3.11+
- **Database**: PostgreSQL + Prisma/SQLAlchemy
- **File Storage**: AWS S3 or local storage (Phase 1)
- **Authentication**: JWT tokens

### Voice Integration (Decision Point)
**Option 1 (Recommended for MVP): ElevenLabs Conversational AI**
- ✅ Built-in turn detection
- ✅ Natural conversation flow
- ✅ Easy transcript access
- ❌ Less control over prompt/behavior mid-conversation

**Option 2: OpenAI Realtime API**
- ✅ More control over agent behavior
- ✅ Can dynamically update instructions
- ✅ Native integration with GPT models
- ❌ More complex implementation
- ❌ Need to handle audio streaming yourself

**Recommendation**: Start with **ElevenLabs** for MVP, then potentially migrate to OpenAI Realtime if you need more control.

### LLM Services
- **Attack Plan Generation**: GPT5.1 (low reasoning mode)
- **Lifeline Advice**: GPT5.1 (no reasoning mode)
- **Post-Interview Analysis**: Gemini 3 Pro
- **Interview Agent**: ElevenLabs AI or OpenAI Realtime

---

## 📊 Database Schema

```sql
-- Users table
users
  - id (uuid)
  - email (string)
  - created_at (timestamp)

-- Interview Sessions
interview_sessions
  - id (uuid)
  - user_id (foreign key)
  - role_title (string)
  - job_description (text)
  - interview_type (enum: 'behavioral', 'technical', 'both')
  - status (enum: 'setup', 'in_progress', 'paused', 'completed')
  - attack_plan (jsonb) -- hidden from user
  - lifeline_enabled (boolean)
  - created_at (timestamp)
  - completed_at (timestamp, nullable)

-- Resume uploads
resumes
  - id (uuid)
  - session_id (foreign key)
  - file_url (string)
  - parsed_content (text)
  - extracted_data (jsonb) -- skills, experience, gaps
  - created_at (timestamp)

-- Transcript messages
transcript_messages
  - id (uuid)
  - session_id (foreign key)
  - speaker (enum: 'interviewer', 'candidate')
  - content (text)
  - timestamp (timestamp)
  - sequence_number (integer)
  - audio_url (string, nullable)

-- Lifeline requests
lifeline_requests
  - id (uuid)
  - session_id (foreign key)
  - message_id (foreign key) -- which message triggered lifeline
  - advice_given (text)
  - created_at (timestamp)

-- Interview feedback
interview_feedback
  - id (uuid)
  - session_id (foreign key)
  - overall_score (integer) -- 1-10
  - bullshit_meter (integer) -- 0-100
  - waffle_score (integer) -- 0-100
  - strengths (jsonb) -- [{category, note, transcript_refs}]
  - weaknesses (jsonb) -- [{category, note, transcript_refs}]
  - annotations (jsonb) -- [{message_id, type: 'good'|'bad', comment}]
  - created_at (timestamp)
```

---

## 🚀 Implementation Phases

### **Phase 1: MVP (Core Functionality)**

#### Week 1-2: Foundation
1. **Project Setup**
   - Initialize Next.js frontend
   - Initialize FastAPI backend
   - Set up PostgreSQL database
   - Configure environment variables
   - Set up basic authentication

2. **Resume & JD Upload**
   - File upload UI (drag & drop)
   - Resume parsing (use `pypdf2` + `python-docx`)
   - Job description scraping (simple URL fetch or paste)
   - Extract keywords using GPT5.1 (low reasoning)

#### Week 2-3: Attack Plan Generation
3. **Analysis Engine**
   - Resume analyzer: extract skills, experience, projects
   - JD analyzer: extract required skills, keywords
   - Gap detector: find mismatches and weak points
   - Attack plan generator: create interview strategy

   ```python
   # Attack plan structure
   {
     "focus_areas": [
       {
         "area": "Python experience",
         "angle": "Claims 5 years but only 1 project shown",
         "probing_questions": [
           "Tell me about your experience with Python async/await",
           "What Python frameworks have you worked with in production?"
         ]
       }
     ],
     "technical_depth": ["Kubernetes", "System Design"],
     "behavioral_themes": ["Leadership", "Conflict resolution"],
     "difficulty_progression": "gradual" // or "aggressive"
   }
   ```

#### Week 3-4: Voice Interview System
4. **ElevenLabs Integration**
   - Set up ElevenLabs Conversational AI SDK
   - Configure agent with dynamic system prompt (from attack plan)
   - Implement WebSocket connection for real-time audio
   - Build transcript capture and storage
   - Create voice UI with waveform visualization

5. **Interview Flow**
   - Session management (start, pause, resume, end)
   - Real-time transcript display
   - Audio recording and playback
   - Interview state management

#### Week 4-5: Lifeline Feature
6. **Pause & Advice System**
   - Pause button (stops ElevenLabs conversation)
   - Context extraction (last N messages)
   - GPT5.1 (no reasoning) advice generation
   - Resume interview functionality

7. **Lifeline UI**
   - Modal/sidebar for advice
   - Show recent context
   - Display suggestions
   - "Continue Interview" button

#### Week 5-6: Post-Interview Analysis
8. **Feedback Generation**
   - Send full transcript to Gemini 3 Pro
   - Generate structured feedback JSON
   - Calculate scores (bullshit meter, waffle score)
   - Identify good/bad moments
   - Store annotations with transcript references

9. **Results UI**
   - Summary dashboard (scores, key metrics)
   - Annotated transcript viewer
   - Color-coded messages (green/red)
   - Expandable suggestions
   - Download/share functionality

---

## 🔧 Detailed Feature Breakdown

### 1. Resume & JD Analysis

**Backend Endpoint**: `POST /api/sessions/create`

```python
# Request
{
  "resume_file": "base64_encoded_or_url",
  "job_description": "text or url",
  "role_title": "Senior Backend Engineer",
  "interview_type": "both"
}

# Processing steps:
1. Parse resume (extract text)
2. Extract structured data (GPT5.1 low reasoning with structured outputs)
   - Skills: ["Python", "Django", "PostgreSQL"]
   - Experience: [{role, company, duration, achievements}]
   - Education: [...]
3. Parse job description
4. Extract JD requirements and keywords
5. Identify gaps and mismatches
6. Generate attack plan
7. Return session_id
```

**Key Libraries**:
- `pypdf2`, `python-docx` for parsing
- `beautifulsoup4` for JD scraping
- `openai` SDK for GPT5.1 structured outputs

### 2. Voice Interview System

**ElevenLabs Integration**:

```javascript
// Frontend: Initialize conversation
import { Conversation } from '@11labs/client';

const conversation = new Conversation({
  agentId: process.env.ELEVENLABS_AGENT_ID,
  // Dynamic system prompt injected with attack plan
  overrides: {
    agent: {
      prompt: {
        prompt: generateInterviewerPrompt(attackPlan)
      }
    }
  },
  onMessage: (message) => {
    // Save to transcript in real-time
    saveTranscriptMessage(message);
  },
  onStatusChange: (status) => {
    // Handle connection state
  }
});

await conversation.startSession();
```

**Backend Webhook** (if using ElevenLabs webhooks):
```python
@app.post("/api/interview/webhook")
async def elevenlabs_webhook(data: dict):
    # Process transcript events
    # Update database
    # Trigger any analysis if needed
```

**Alternative: OpenAI Realtime API**:
```python
# WebSocket handler
async def interview_websocket(websocket: WebSocket, session_id: str):
    # Establish connection to OpenAI Realtime API
    # Relay audio chunks bidirectionally
    # Capture and store transcript
    # Handle interruptions and pauses
```

### 3. Lifeline Feature

**Backend Endpoint**: `POST /api/interview/lifeline`

```python
@app.post("/api/interview/{session_id}/lifeline")
async def get_lifeline_advice(session_id: str):
    # Get last 5 messages from transcript
    recent_context = get_recent_messages(session_id, limit=5)

    # Get attack plan for context
    attack_plan = get_attack_plan(session_id)

    # Generate advice with GPT5.1 (no reasoning mode)
    advice = await openai.chat.completions.create(
        model="gpt-5.1",
        reasoning_effort="no_reasoning",
        messages=[
            {"role": "system", "content": LIFELINE_PROMPT},
            {"role": "user", "content": format_lifeline_context(
                recent_context, attack_plan
            )}
        ]
    )

    # Store lifeline request
    save_lifeline_request(session_id, advice)

    return {"advice": advice}
```

**Lifeline Prompt Template**:
```
You are helping a candidate in a mock interview. They've paused to ask for help.

Recent conversation:
{transcript_context}

The interviewer is probing about: {current_focus_area}

Provide:
1. What the interviewer is really asking for (subtext)
2. A strong structure for answering (STAR method, etc.)
3. 2-3 specific points to mention
4. What to avoid saying

Be concise - they need to unpause soon!
```

### 4. Post-Interview Analysis

**Backend Endpoint**: `POST /api/interview/{session_id}/analyze`

```python
@app.post("/api/interview/{session_id}/analyze")
async def analyze_interview(session_id: str):
    # Get full transcript
    transcript = get_full_transcript(session_id)
    attack_plan = get_attack_plan(session_id)

    # Use Gemini 3 Pro for deep analysis
    analysis = await gemini_client.generate_content(
        model="gemini-3-pro",
        contents=format_analysis_prompt(transcript, attack_plan),
        generation_config={
            "response_mime_type": "application/json"
        }
    )

    feedback = parse_feedback_json(analysis)
    save_feedback(session_id, feedback)

    return feedback
```

**Feedback JSON Structure**:
```json
{
  "overall_score": 7,
  "bullshit_meter": 35,
  "waffle_score": 42,
  "summary": "Strong technical knowledge but tendency to over-explain...",
  "strengths": [
    {
      "category": "Technical Depth",
      "note": "Excellent explanation of distributed systems",
      "transcript_refs": [15, 16, 17],
      "quote": "I implemented a saga pattern..."
    }
  ],
  "weaknesses": [
    {
      "category": "Conciseness",
      "note": "Answer rambled without clear structure",
      "transcript_refs": [23, 24],
      "severity": "medium",
      "suggestion": "Use STAR method to structure responses"
    }
  ],
  "annotations": [
    {
      "message_id": "msg_123",
      "type": "good",
      "comment": "Strong specific example with metrics"
    },
    {
      "message_id": "msg_125",
      "type": "bad",
      "comment": "Vague buzzwords without substance"
    }
  ],
  "detailed_feedback": {
    "technical": { ... },
    "behavioral": { ... },
    "communication": { ... }
  }
}
```

---

## 🎨 Frontend UI Components

### 1. Setup Flow (`/app/setup`)
```
┌─────────────────────────────────────┐
│  Upload Resume     [Drop zone]      │
│  Job Role:         [Text input]     │
│  Job Description:  [URL or paste]   │
│  Interview Type:   ○ Behavioral     │
│                    ○ Technical       │
│                    ● Both            │
│  Lifeline:         [Toggle ON/OFF]  │
│                                      │
│         [Start Interview →]         │
└─────────────────────────────────────┘
```

### 2. Interview UI (`/app/interview/[sessionId]`)
```
┌────────────────────┬─────────────────┐
│                    │   Transcript    │
│                    │ ┌─────────────┐ │
│    🎤 SPEAKING     │ │ Interviewer:│ │
│                    │ │ Tell me...  │ │
│   [Waveform viz]   │ │             │ │
│                    │ │ You:        │ │
│   ⏸ Pause          │ │ I worked... │ │
│   💡 Lifeline      │ │             │ │
│   🛑 End           │ └─────────────┘ │
│                    │                 │
└────────────────────┴─────────────────┘
```

### 3. Lifeline Modal
```
┌─────────────────────────────────────┐
│  💡 Interview Paused                │
│                                      │
│  Recent Context:                    │
│  Q: "Tell me about your Python..."  │
│  A: "I've worked with Python..."    │
│                                      │
│  Advice:                            │
│  • They're probing depth - give     │
│    a specific technical example     │
│  • Mention async/await usage        │
│  • Keep under 90 seconds            │
│                                      │
│         [Continue Interview]        │
└─────────────────────────────────────┘
```

### 4. Results UI (`/app/results/[sessionId]`)
```
┌─────────────────────────────────────┐
│  Interview Results                  │
│                                      │
│  Overall Score:  7/10  ████████░░   │
│  💩 BS Meter:    35%   ████░░░░░░   │
│  🗨 Waffle:      42%   █████░░░░░   │
│                                      │
│  ✅ Strengths                        │
│  • Technical depth (messages 15-17) │
│  • Specific examples                │
│                                      │
│  ❌ Areas to Improve                 │
│  • Conciseness (message 23-24)      │
│  • Structure your answers           │
│                                      │
│  📝 Annotated Transcript            │
│  ┌───────────────────────────────┐  │
│  │ [15] ✅ You: "I implemented   │  │
│  │     a saga pattern..." +3     │  │
│  │                                │  │
│  │ [23] ❌ You: "Well, you know  │  │
│  │     it's like..." -2          │  │
│  └───────────────────────────────┘  │
│                                      │
│  [Download Report] [New Interview]  │
└─────────────────────────────────────┘
```

---

## 📝 Key API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login

POST   /api/sessions/create
  → Upload resume, JD, generate attack plan
  → Returns session_id

GET    /api/sessions/{session_id}
  → Get session details (no attack plan!)

POST   /api/sessions/{session_id}/start
  → Initialize voice conversation
  → Returns WebSocket URL or connection details

WS     /api/sessions/{session_id}/interview
  → WebSocket for real-time audio/transcript

POST   /api/sessions/{session_id}/pause
POST   /api/sessions/{session_id}/resume
POST   /api/sessions/{session_id}/end

POST   /api/sessions/{session_id}/lifeline
  → Get advice, returns structured guidance

GET    /api/sessions/{session_id}/transcript
  → Get full transcript

POST   /api/sessions/{session_id}/analyze
  → Generate feedback (after interview ends)

GET    /api/sessions/{session_id}/feedback
  → Get generated feedback with annotations
```

---

## 🔐 Security & Privacy Considerations

1. **Resume Data**:
   - Encrypt at rest
   - Don't store longer than necessary
   - Give users ability to delete

2. **Attack Plan**:
   - Never expose to frontend
   - Only accessible to backend AI services

3. **Audio Storage**:
   - Optional - let users opt in
   - Auto-delete after 30 days

4. **Rate Limiting**:
   - Prevent abuse of expensive LLM calls
   - Limit interview sessions per user

---

## 💰 Cost Optimization

1. **Use appropriate models**:
   - Attack plan: GPT5.1 low reasoning (balance quality/cost)
   - Lifeline: GPT5.1 no reasoning (speed + low cost)
   - Analysis: Gemini 3 Pro (best reasoning)

2. **Cache common patterns**:
   - Cache common job descriptions
   - Reuse attack plan strategies

3. **Streaming**:
   - Use streaming for better UX
   - Reduce timeout costs

---

## 🚢 Deployment Strategy

### Phase 1 MVP:
- **Frontend**: Vercel
- **Backend**: Railway / Render / DigitalOcean
- **Database**: Supabase (Postgres) or Railway
- **File Storage**: S3 or Vercel Blob

### Monitoring:
- Sentry for error tracking
- PostHog for analytics
- Custom logging for LLM costs

---

## 🎯 Phase 1 MVP Scope (Minimum Viable Product)

**Must Have**:
- ✅ Resume + JD upload
- ✅ Attack plan generation
- ✅ Voice interview (ElevenLabs)
- ✅ Real-time transcript
- ✅ Lifeline feature
- ✅ Post-interview analysis
- ✅ Annotated transcript viewer
- ✅ Bullshit meter / Waffle score

**Nice to Have (Post-MVP)**:
- Video avatar (ElevenLabs + D-ID)
- Multiple interviewer personas
- Interview recording playback
- Social sharing ("I got grilled 🔥")
- Historical progress tracking
- Mobile app

---

## 🔄 Next Steps

1. **Validate tech stack choices** - ElevenLabs or OpenAI Realtime?
2. **Set up repository structure** - Monorepo or separate repos?
3. **Begin with project scaffolding** - Initialize Next.js + FastAPI
4. **Implement first feature** - Resume upload and parsing
