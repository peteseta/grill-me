/**
 * Unit tests for analyze.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSession, getSessionResults } from './analyze';
import { TranscriptMessage } from '../types/database';

// Mock data
const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockConversationId = 'elevenlabs-conv-123';

const mockTranscript: TranscriptMessage[] = [
  {
    index: 0,
    role: 'agent',
    text: 'Hello! Can you tell me about your React experience?',
    timestamp: 0,
  },
  {
    index: 1,
    role: 'user',
    text: 'I leverage synergies with component-based architecture.',
    timestamp: 5,
  },
  {
    index: 2,
    role: 'agent',
    text: 'Can you give a specific example?',
    timestamp: 10,
  },
  {
    index: 3,
    role: 'user',
    text: 'I built a dashboard using useState and useEffect hooks with REST API integration.',
    timestamp: 15,
  },
];

const mockSession = {
  id: mockSessionId,
  user_id: 'user-123',
  role_title: 'Senior Frontend Engineer',
  company_name: 'Tech Corp',
  job_description: 'Looking for React expert',
  interview_type: 'Technical' as const,
  status: 'in_progress' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  resume_text: 'John Doe\nSoftware Engineer',
};

const mockAnalysis = {
  score_overall: 7,
  score_bullshit: 45,
  score_technical: 75,
  summary_feedback: 'Good technical depth with some buzzword usage.',
  structured_feedback: [
    {
      target_message_index: 1,
      exact_quote: 'leverage synergies',
      type: 'negative' as const,
      category: 'Buzzwords',
      feedback: 'Vague buzzword usage',
    },
    {
      target_message_index: 3,
      exact_quote: 'useState and useEffect hooks',
      type: 'positive' as const,
      category: 'Technical',
      feedback: 'Specific technical details',
    },
  ],
};

const mockAnalysisRecord = {
  id: 'analysis-123',
  session_id: mockSessionId,
  full_transcript_json: mockTranscript,
  audio_url: 'https://audio.example.com/recording.mp3',
  feedback_summary: mockAnalysis.summary_feedback,
  structured_feedback: mockAnalysis.structured_feedback,
  score_bullshit: mockAnalysis.score_bullshit,
  score_overall: mockAnalysis.score_overall,
  score_technical: mockAnalysis.score_technical,
  created_at: new Date().toISOString(),
};

// Mock modules
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: table === 'interview_sessions' ? mockSession : mockAnalysisRecord,
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockAnalysisRecord,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockSession, error: null })),
      })),
    })),
  })),
}));

vi.mock('../services/elevenlabs', () => ({
  fetchTranscript: vi.fn(() => Promise.resolve(mockTranscript)),
  fetchAudioUrl: vi.fn(() => Promise.resolve('https://audio.example.com/recording.mp3')),
}));

vi.mock('../services/interview-analyzer', () => ({
  analyzeInterview: vi.fn(() => Promise.resolve(mockAnalysis)),
}));

describe('analyzeSession', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        param: vi.fn(() => mockSessionId),
        json: vi.fn(() => Promise.resolve({ conversation_id: mockConversationId })),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
        ELEVENLABS_API_KEY: 'test-key',
        OPENAI_API_KEY: 'test-key',
      },
    };
  });

  it('should successfully analyze an interview session', async () => {
    const response = await analyzeSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session_id).toBe(mockSessionId);
    expect(data.metrics.score_overall).toBe(7);
    expect(data.metrics.score_bullshit).toBe(45);
    expect(data.metrics.score_technical).toBe(75);
    expect(data.summary_feedback).toBe(mockAnalysis.summary_feedback);
    expect(data.full_transcript_json).toHaveLength(4);
    expect(data.structured_feedback).toHaveLength(2);
  });

  it('should return 400 if conversation_id is missing', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({}));
    
    const response = await analyzeSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing conversation_id');
  });
});

describe('getSessionResults', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        param: vi.fn(() => mockSessionId),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      },
    };
  });

  it('should retrieve cached analysis results', async () => {
    const response = await getSessionResults(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session_id).toBe(mockSessionId);
    expect(data.metrics.score_overall).toBe(7);
    expect(data.summary_feedback).toBe(mockAnalysis.summary_feedback);
  });
});

// Manual test helper
export function logMockData() {
  console.log('\n=== Mock Test Data ===\n');
  console.log('Session ID:', mockSessionId);
  console.log('Conversation ID:', mockConversationId);
  console.log('\nMock Transcript:');
  mockTranscript.forEach(msg => {
    console.log(`  [${msg.role}]: ${msg.text}`);
  });
  console.log('\nMock Analysis:');
  console.log('  Overall Score:', mockAnalysis.score_overall);
  console.log('  Bullshit Score:', mockAnalysis.score_bullshit);
  console.log('  Technical Score:', mockAnalysis.score_technical);
  console.log('  Summary:', mockAnalysis.summary_feedback);
  console.log('\nStructured Feedback:');
  mockAnalysis.structured_feedback.forEach(fb => {
    console.log(`  [${fb.type}] ${fb.category}: "${fb.exact_quote}"`);
    console.log(`    → ${fb.feedback}`);
  });
}
