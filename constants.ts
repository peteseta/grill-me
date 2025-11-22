import { InterviewType } from './types';

export const APP_NAME = "Mock Interviewer AI";

// Backend API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ElevenLabs Agent ID for voice interviews
// Set VITE_ELEVENLABS_AGENT_ID in your .env file or use the default
export const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_5601kaphkp22fq6b45w9qbszetfm";

export const DEFAULT_JOB_DESCRIPTION = `We are looking for a Senior React Engineer to join our team. 
The ideal candidate should have experience with:
- React 18+ and TypeScript
- State management (Zustand/Redux)
- Performance optimization
- System design for frontend applications
`;

export const INTERVIEW_TYPES = [
  { value: InterviewType.BEHAVIORAL, label: 'Behavioral', description: 'Focus on soft skills, leadership, and STAR method.' },
  { value: InterviewType.TECHNICAL, label: 'Technical', description: 'System design, coding concepts, and architecture.' },
  { value: InterviewType.BOTH, label: 'Hybrid', description: 'A mix of technical deep-dives and behavioral questions.' },
];