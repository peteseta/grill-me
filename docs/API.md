## 1. Session Setup & Attack Plan

### `POST /api/v1/sessions`
Initializes a new interview session. This triggers the **Resume Parsing** and **Attack Plan Generation** (LLM) immediately.

**Request (`multipart/form-data`)**:
*   `resume`: File
*   `job_description_text`: String
*   `user_id`: UUID
*   `interview_type`: String (one of "Technical", "Behavioral", "Mixed")

**Response (`201 Created`)**:
```json
{
  "session_id": "sess_12345_uuid",
  "status": "ready"
}
```

---

## 2. Interview Configuration (ElevenLabs Handoff)

This endpoint provides the frontend with the specific variable values needed to initialize the `useConversation` hook.

### `GET /api/v1/sessions/{session_id}/config`

**Response (`200 OK`)**:
```json
{
  "agent_id": "eleven_agent_id_xyz", // Your Agent ID from ENV/DB
  "dynamic_variables": {
    "ROLE_TITLE": "Product Manager",
    "CANDIDATE_NAME": "Pete",
    "COMPANY_NAME": "Microsoft",
    "INTERVIEW_TYPE": "Mixed",
    
    // The backend returns this as a standard JSON object.
    // The Frontend must JSON.stringify() this before passing it to the SDK.
    "ATTACK_PLAN_JSON": {
      "difficulty": "aggressive",
      "focus_areas": [
        {
          "topic": "Mango Project",
          "context": "Resume claims 520+ landmarks...",
          "probing_questions": ["Did you validate this with users?"]
        }
      ]
    },
    
    "RESUME_TEXT": "[parsed resume content]"
  }
}
```

**Frontend Implementation Note:**
When calling `conversation.startSession`, you must stringify the `ATTACK_PLAN_JSON` so the Agent can read it as text.

```javascript
// Frontend Code
const startInterview = async () => {
  // 1. Fetch config from your backend
  const { agent_id, dynamic_variables } = await fetchConfig(sessionId);

  // 2. Start session with mapped variables
  await conversation.startSession({
    agentId: agent_id,
    dynamicVariables: {
      ...dynamic_variables,
      // Convert the object to a string for the LLM to read
      ATTACK_PLAN_JSON: JSON.stringify(dynamic_variables.ATTACK_PLAN_JSON, null, 2)
    }
  });
};
```

---

## 3. Lifeline (Real-time Assistance)

### `POST /api/v1/sessions/{session_id}/lifeline`
Called when the user hits "Pause" and asks for help.

*   **Request (`application/json`)**:
    ```json
    {
      "transcript_history": [
        { "role": "agent", "text": "Why did you build this from scratch?" },
        { "role": "user", "text": "Uhh, well I thought it would be..." }
      ]
    }
    ```

*   **Response (`200 OK`)**:
    ```json
    {
      "advice": "The interviewer is testing your 'Build vs Buy' judgment. Don't justify the technical code. Pivot to explaining the specific unique constraint that forced you to build custom.",
      "suggested_opening": "I evaluated off-the-shelf tools, but..."
    }
    ```

---

## 4. Post-Interview Analysis

This endpoint performs two tasks:
1. Fetches the "official" high-quality transcript from ElevenLabs servers using the `conversation_id`.
2. Sends that transcript to the Reasoning LLM (Gemini/GPT-4o) to generate the JSON feedback.
3. Stores the feedback in the interview_analyses table for future retrieval

### `POST /api/v1/sessions/{session_id}/analyze`

*   **Request (`application/json`)**:
    ```json
    {
      "conversation_id": "conv_elevenlabs_id_xyz" 
    }
    ```

*   **Response (`200 OK`)**:
    *   **Crucial:** This schema allows the frontend to highlight specific text.
    *   **UI Logic:** The Frontend iterates through `structured_feedback`. It finds the `message_index` in the transcript, finds the `exact_quote` string within that message, and wraps it in a colored span.

    ```json
    {
      "session_id": "sess_12345",
      "metrics": {
        "score_overall": 7, // 1-10
        "score_bullshit": 65, // 0-100 (high = bad)
        "score_technical": 80 // 0-100 (high = good)
      },
      "summary_feedback": "Strong technical foundation, but you struggled to justify business value...",
      
      // The High-Fidelity Transcript (saved from ElevenLabs)
      "full_transcript_json": [
        { 
          "index": 0, 
          "role": "agent", 
          "text": "Why did you build this?", 
          "timestamp": 0.5 
        },
        { 
          "index": 1, 
          "role": "user", 
          "text": "I utilized a blockchain backbone to democratize the data layer.", 
          "timestamp": 2.1 
        }
      ],

      // The Formatting Instructions
      "structured_feedback": [
        {
          "target_message_index": 1, // Points to the user's message above
          "exact_quote": "utilized a blockchain backbone",
          "type": "negative", // mapped to CSS class 'bg-red-200'
          "category": "buzzword_stuffing",
          "feedback": "This added no value to the answer and sounded forced."
        },
        {
          "target_message_index": 1,
          "exact_quote": "democratize the data layer",
          "type": "warning", // mapped to CSS class 'bg-yellow-200'
          "category": "vagueness",
          "feedback": "Too abstract. Be specific about what data changed."
        },
        {
          "target_message_index": 5,
          "exact_quote": "I reduced latency by 40%",
          "type": "positive", // mapped to CSS class 'bg-green-200'
          "category": "concrete_metric",
          "feedback": "Excellent use of specific metrics."
        }
      ]
    }
    ```

---

## 5. History & Retrieval

### `GET /api/v1/sessions`

Retrieves a list of past interview sessions for a specific user. This is used to populate the main dashboard.

*   **Query Parameters:**
    *   `user_id` (UUID, Required): The ID of the user whose sessions you want to retrieve.

    *Example URL:* `/api/v1/sessions?user_id=123e4567-e89b-12d3-a456-426614174000`

*   **Response (`200 OK`)**:
    ```json
    [
      {
        "session_id": "sess_98765_uuid",
        "created_at": "2023-10-27T10:00:00Z",
        "role_title": "Product Manager",
        "company_name": "Microsoft",
        "status": "completed", // 'setup', 'completed', 'in_progress'
        "scores": {
          "score_overall": 7,
          "score_bullshit": 65
        }
      },
      {
        "session_id": "sess_54321_uuid",
        "created_at": "2023-10-26T14:30:00Z",
        "role_title": "Senior Frontend Dev",
        "company_name": "Netflix",
        "status": "setup", // User uploaded resume but hasn't started interview
        "scores": null
      }
    ]
    ```

*   **Error Responses:**
    *   `400 Bad Request`: Missing `user_id`.
    *   `404 Not Found`: User does not exist.

### `GET /api/v1/sessions/{session_id}/results`
Retrieves the analysis if the user revisits the page later (caches the result of the `/analyze` endpoint).

*   **Response**: Same JSON object as `/analyze`.