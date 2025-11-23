/**
 * API request and response type definitions
 */

import { AttackPlan, StructuredFeedbackItem, TranscriptMessage } from './database';

/**
 * POST /api/v1/sessions
 */
export interface CreateSessionRequest {
  resume: File; // multipart/form-data
  job_description_text: string;
  user_id: string; // UUID
  interview_type: 'Technical' | 'Behavioral' | 'Mixed';
  role_title?: string;
  company_name?: string;
}

export interface CreateSessionResponse {
  session_id: string;
  status: 'ready';
}

/**
 * GET /api/v1/sessions/{session_id}/config
 */
export interface SessionConfigResponse {
  agent_id: string;
  dynamic_variables: {
    ROLE_TITLE: string;
    CANDIDATE_NAME: string;
    COMPANY_NAME: string;
    INTERVIEW_TYPE: string;
    ATTACK_PLAN_JSON: AttackPlan; // Frontend must JSON.stringify this
    RESUME_TEXT: string;
  };
}

/**
 * POST /api/v1/sessions/{session_id}/lifeline
 */
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

/**
 * POST /api/v1/sessions/{session_id}/analyze
 */
export interface AnalyzeSessionRequest {
  conversation_id: string; // ElevenLabs conversation ID
}

export interface AnalyzeSessionResponse {
  session_id: string;
  metrics: {
    score_overall: number; // 1-10
    score_bullshit: number; // 0-100 (high = bad)
    score_technical: number; // 0-100 (high = good)
  };
  summary_feedback: string;
  full_transcript_json: TranscriptMessage[];
  structured_feedback: StructuredFeedbackItem[];
}

/**
 * GET /api/v1/sessions (query: user_id)
 */
export interface SessionListItem {
  session_id: string;
  created_at: string;
  role_title: string;
  company_name?: string;
  status: 'setup' | 'ready' | 'in_progress' | 'completed';
  scores?: {
    score_overall: number;
    score_bullshit: number;
  } | null;
}

export type SessionListResponse = SessionListItem[];

/**
 * GET /api/v1/sessions/{session_id}/results
 * Same as AnalyzeSessionResponse
 */
export type SessionResultsResponse = AnalyzeSessionResponse;

/**
 * POST /api/v1/auth/register
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * POST /api/v1/auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
