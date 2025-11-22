export enum InterviewType {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  BOTH = 'both'
}

export enum SessionStatus {
  SETUP = 'setup',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum Speaker {
  INTERVIEWER = 'interviewer',
  CANDIDATE = 'candidate'
}

export interface TranscriptMessage {
  id: string;
  speaker: Speaker;
  content: string;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  roleTitle: string;
  jobDescription: string;
  interviewType: InterviewType;
  status: SessionStatus;
  startTime: number;
}

export interface AnalysisResult {
  overallScore: number;
  bullshitMeter: number;
  waffleScore: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

// Mock Types for API Responses
export interface CreateSessionResponse {
  sessionId: string;
  status: string;
}