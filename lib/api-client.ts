/**
 * API Client for Grill Me Backend
 * Handles all communication with the Cloudflare Workers backend
 */

// In development with Vite proxy, use empty string for relative URLs
// In production, use the full backend URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Session API types
 */
export interface CreateSessionRequest {
  resume: File;
  job_description_text: string;
  user_id: string;
  interview_type: 'Technical' | 'Behavioral' | 'Mixed';
  role_title: string;
  company_name: string;
}

export interface CreateSessionResponse {
  session_id: string;
  status: 'ready';
}

export interface SessionConfigResponse {
  agent_id: string;
  dynamic_variables: {
    ROLE_TITLE: string;
    CANDIDATE_NAME: string;
    COMPANY_NAME: string;
    INTERVIEW_TYPE: string;
    ATTACK_PLAN_JSON: any;
    RESUME_TEXT: string;
  };
}

export interface SessionListItem {
  session_id: string;
  created_at: string;
  role_title: string;
  company_name: string;
  status: 'setup' | 'ready' | 'in_progress' | 'completed';
  scores?: {
    score_overall: number;
    score_bullshit: number;
    score_technical: number;
  } | null;
}

export interface LifelineRequest {
  transcript_history: {
    role: 'agent' | 'user';
    text: string;
  }[];
}

export interface LifelineResponse {
  advice: string;
  suggested_opening: string;
}

export interface AnalyzeSessionRequest {
  conversation_id: string;
}

export interface TranscriptMessage {
  index: number;
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

export interface StructuredFeedbackItem {
  target_message_index: number;
  exact_quote: string;
  type: 'negative' | 'warning' | 'positive';
  category: string;
  feedback: string;
}

export interface AnalyzeSessionResponse {
  session_id: string;
  role_title: string;
  company_name: string;
  created_at: string;
  metrics: {
    score_overall: number;
    score_bullshit: number;
    score_technical: number;
  };
  summary_feedback: string;
  full_transcript_json: TranscriptMessage[];
  structured_feedback: StructuredFeedbackItem[];
  audio_url?: string;
}

/**
 * API Client class
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * POST /api/v1/sessions
   * Create a new interview session
   */
  async createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    const formData = new FormData();
    formData.append('resume', data.resume);
    formData.append('job_description_text', data.job_description_text);
    formData.append('user_id', data.user_id);
    formData.append('interview_type', data.interview_type);
    formData.append('role_title', data.role_title);
    formData.append('company_name', data.company_name);

    const response = await fetch(`${this.baseUrl}/api/v1/sessions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create session: ${error}`);
    }

    return response.json();
  }

  /**
   * GET /api/v1/sessions
   * List all sessions for a user
   */
  async listSessions(userId: string): Promise<SessionListItem[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions?user_id=${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list sessions: ${error}`);
    }

    return response.json();
  }

  /**
   * GET /api/v1/sessions/{session_id}/config
   * Get ElevenLabs configuration for the interview
   */
  async getSessionConfig(sessionId: string): Promise<SessionConfigResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/config`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get session config: ${error}`);
    }

    return response.json();
  }

  /**
   * POST /api/v1/sessions/{session_id}/lifeline
   * Get real-time assistance during interview
   */
  async requestLifeline(sessionId: string, data: LifelineRequest): Promise<LifelineResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/lifeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to request lifeline: ${error}`);
    }

    return response.json();
  }

  /**
   * POST /api/v1/sessions/{session_id}/analyze
   * Analyze the interview and generate feedback
   */
  async analyzeSession(sessionId: string, data: AnalyzeSessionRequest): Promise<AnalyzeSessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to analyze session: ${error}`);
    }

    return response.json();
  }

  /**
   * GET /api/v1/sessions/{session_id}/results
   * Get cached analysis results
   */
  async getSessionResults(sessionId: string): Promise<AnalyzeSessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/results`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get session results: ${error}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
