/**
 * Unit tests for session-config.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionConfig } from './session-config';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

const mockSession = {
  id: mockSessionId,
  user_id: 'user-123',
  role_title: 'Senior Frontend Engineer',
  company_name: 'Tech Corp',
  job_description: 'Looking for React expert',
  interview_type: 'Technical' as const,
  status: 'ready' as const,
  attack_plan: {
    difficulty: 'moderate' as const,
    focus_areas: [
      {
        topic: 'React Hooks',
        context: 'Test understanding of useState and useEffect',
        probing_questions: ['Explain useState', 'When to use useEffect?'],
      },
    ],
  },
  parsed_resume: {
    raw_text: 'John Doe\nSoftware Engineer',
    candidate_name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Create a mock result that can be controlled per test
let mockSupabaseResult = { data: mockSession, error: null };

// Mock Supabase client
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => mockSupabaseResult),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockSession, error: null })),
      })),
    })),
  })),
}));

describe('getSessionConfig', () => {
  let mockContext: any;

  beforeEach(() => {
    // Reset mock result to default
    mockSupabaseResult = { data: mockSession, error: null };

    mockContext = {
      req: {
        param: vi.fn(() => mockSessionId),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
        ELEVENLABS_AGENT_ID: 'agent-123',
      },
    };
  });

  it('should return session config for ready session', async () => {
    const response = await getSessionConfig(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agent_id).toBe('agent-123');
    expect(data.dynamic_variables).toMatchObject({
      ROLE_TITLE: 'Senior Frontend Engineer',
      CANDIDATE_NAME: 'John Doe',
      COMPANY_NAME: 'Tech Corp',
      INTERVIEW_TYPE: 'Technical',
      RESUME_TEXT: 'John Doe\nSoftware Engineer',
    });
    expect(data.dynamic_variables.ATTACK_PLAN_JSON).toEqual(mockSession.attack_plan);
  });

  it('should return session config for in_progress session', async () => {
    mockSupabaseResult = {
      data: { ...mockSession, status: 'in_progress' },
      error: null,
    };

    const response = await getSessionConfig(mockContext);
    expect(response.status).toBe(200);
  });

  it('should return 400 if session_id is missing', async () => {
    mockContext.req.param = vi.fn(() => null);

    const response = await getSessionConfig(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing session_id');
  });

  it('should return 404 if session not found', async () => {
    mockSupabaseResult = {
      data: null,
      error: { message: 'Not found' },
    };

    const response = await getSessionConfig(mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
  });

  it('should return 400 if session is not ready or in_progress', async () => {
    mockSupabaseResult = {
      data: { ...mockSession, status: 'completed' },
      error: null,
    };

    const response = await getSessionConfig(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Session is not ready');
  });

  it('should use default values when optional fields are missing', async () => {
    mockSupabaseResult = {
      data: {
        ...mockSession,
        company_name: null,
        parsed_resume: { raw_text: 'Resume text' },
      },
      error: null,
    };

    const response = await getSessionConfig(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dynamic_variables.CANDIDATE_NAME).toBe('Candidate');
    expect(data.dynamic_variables.COMPANY_NAME).toBe('the company');
  });
});
