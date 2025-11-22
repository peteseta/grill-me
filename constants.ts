import { InterviewType } from './types';

export const APP_NAME = "Mock Interviewer AI";

// TODO: Replace with your actual ElevenLabs Agent ID
export const ELEVENLABS_AGENT_ID = "replace-with-your-agent-id";

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

// Mock Transcript Data for UI testing
export const MOCK_TRANSCRIPT = [
  {
    id: '1',
    speaker: 'interviewer',
    content: "Hello! Thanks for joining. I've reviewed your resume and I'm excited to chat. Let's start with a brief introduction. Tell me about your experience with React.",
    timestamp: Date.now() - 100000
  },
  {
    id: '2',
    speaker: 'candidate',
    content: "Hi! Sure. I've been working with React for about 5 years now. I started with class components and migrated to hooks. Recently I've been focused on performance tuning for large scale dashboards.",
    timestamp: Date.now() - 80000
  },
  {
    id: '3',
    speaker: 'interviewer',
    content: "That sounds interesting. Can you walk me through a specific challenge you faced when optimizing those dashboards?",
    timestamp: Date.now() - 60000
  }
];