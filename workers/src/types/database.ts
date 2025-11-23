/**
 * Database type definitions based on the Supabase schema
 */

export interface User {
  id: string; // UUID
  email: string;
  created_at: string; // ISO timestamp
}

export interface InterviewSession {
  id: string; // UUID
  user_id: string; // UUID
  role_title: string;
  company_name?: string;
  job_description?: string;
  interview_type: 'Technical' | 'Behavioral' | 'Mixed';
  attack_plan?: AttackPlan;
  status: 'setup' | 'ready' | 'in_progress' | 'completed';
  elevenlabs_conversation_id?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  resume_text?: string;
  candidate_name?: string;
}

export interface InterviewAnalysis {
  id: string; // UUID
  session_id: string; // UUID (unique)
  full_transcript_json?: TranscriptMessage[];
  audio_url?: string;
  feedback_summary?: string;
  structured_feedback?: StructuredFeedbackItem[];
  created_at: string; // ISO timestamp
  score_bullshit?: number; // 0-100
  score_overall?: number; // 1-10
  score_technical?: number; // 0-100
}

/**
 * Attack plan structure for LLM-generated interview strategy
 */
export interface AttackPlan {
  difficulty: 'gentle' | 'moderate' | 'aggressive';
  focus_areas: FocusArea[];
}

export interface FocusArea {
  topic: string;
  context: string;
  probing_questions: string[];
}

/**
 * Transcript message structure
 */
export interface TranscriptMessage {
  index: number;
  role: 'agent' | 'user';
  text: string;
  timestamp: number; // seconds
}

/**
 * Structured feedback for highlighting specific parts of the transcript
 */
export interface StructuredFeedbackItem {
  target_message_index: number;
  exact_quote: string;
  type: 'positive' | 'negative' | 'warning';
  category: string;
  feedback: string;
}
