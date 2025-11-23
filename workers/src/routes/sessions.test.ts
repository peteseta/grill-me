/**
 * Unit tests for sessions.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, listSessions } from './sessions';

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
const mockUserId = 'user-123';

const mockParsedResume = {
  raw_text: 'John Doe\nSoftware Engineer',
  candidate_name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  skills: ['React', 'TypeScript'],
  experience: [
    {
      company: 'Tech Corp',
      title: 'Software Engineer',
      duration: '2020-2023',
      description: 'Built web applications',
    },
  ],
  education: [
    {
      institution: 'University',
      degree: 'BS Computer Science',
      year: '2020',
    },
  ],
};

const mockAttackPlan = {
  difficulty: 'moderate' as const,
  focus_areas: [
    {
      topic: 'React Experience',
      context: 'Testing React knowledge',
      probing_questions: ['Tell me about React hooks'],
    },
  ],
};

const mockSession = {
  id: mockSessionId,
  user_id: mockUserId,
  role_title: 'Senior Frontend Engineer',
  company_name: 'Tech Corp',
  job_description: 'Looking for React expert',
  interview_type: 'Technical' as const,
  attack_plan: mockAttackPlan,
  status: 'ready' as const,
  parsed_resume: mockParsedResume,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock services
vi.mock('../services/resume-parser', () => ({
  parseResume: vi.fn(() => Promise.resolve(mockParsedResume)),
}));

vi.mock('../services/attack-plan-generator', () => ({
  generateAttackPlan: vi.fn(() => Promise.resolve(mockAttackPlan)),
}));

vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockSession,
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [
              {
                id: mockSessionId,
                created_at: mockSession.created_at,
                role_title: mockSession.role_title,
                company_name: mockSession.company_name,
                status: mockSession.status,
                interview_analyses: [
                  {
                    score_overall: 8,
                    score_bullshit: 30,
                  },
                ],
              },
            ],
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('createSession', () => {
  let mockContext: any;
  let mockFormData: FormData;

  beforeEach(() => {
    // Create a mock File
    const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });

    mockFormData = new FormData();
    mockFormData.set('resume', mockFile);
    mockFormData.set('job_description_text', 'Looking for React expert');
    mockFormData.set('user_id', mockUserId);
    mockFormData.set('interview_type', 'Technical');
    mockFormData.set('role_title', 'Senior Frontend Engineer');
    mockFormData.set('company_name', 'Tech Corp');

    mockContext = {
      req: {
        formData: vi.fn(() => Promise.resolve(mockFormData)),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
        OPENAI_API_KEY: 'test-key',
      },
    };
  });

  it('should successfully create a new session', async () => {
    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.session_id).toBe(mockSessionId);
    expect(data.status).toBe('ready');
  });

  it('should return 400 if resume is missing', async () => {
    mockFormData.delete('resume');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if job_description_text is missing', async () => {
    mockFormData.delete('job_description_text');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if user_id is missing', async () => {
    mockFormData.delete('user_id');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if interview_type is missing', async () => {
    mockFormData.delete('interview_type');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 if resume is a string instead of file', async () => {
    mockFormData.set('resume', 'not a file');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('resume must be a file, not a string');
  });

  it('should return 400 if interview_type is invalid', async () => {
    mockFormData.set('interview_type', 'Invalid');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('interview_type must be one of');
  });

  it('should handle database insertion errors', async () => {
    const supabaseModule = await vi.importMock<typeof import('../utils/supabase')>('../utils/supabase');
    supabaseModule.getSupabaseClient = vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      })),
    } as any));

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to create session');
  });

  it('should work without optional fields', async () => {
    mockFormData.delete('role_title');
    mockFormData.delete('company_name');

    const response = await createSession(mockContext);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.session_id).toBe(mockSessionId);
  });
});

describe('listSessions', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        query: vi.fn(() => mockUserId),
      },
      env: {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      },
    };
  });

  it('should return list of sessions for user', async () => {
    const response = await listSessions(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      session_id: mockSessionId,
      role_title: 'Senior Frontend Engineer',
      company_name: 'Tech Corp',
      status: 'ready',
      scores: {
        score_overall: 8,
        score_bullshit: 30,
      },
    });
  });

  it('should return 400 if user_id is missing', async () => {
    mockContext.req.query = vi.fn(() => null);

    const response = await listSessions(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing user_id query parameter');
  });

  it('should handle sessions without analyses', async () => {
    const supabaseModule = await vi.importMock<typeof import('../utils/supabase')>('../utils/supabase');
    supabaseModule.getSupabaseClient = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [
                {
                  id: mockSessionId,
                  created_at: mockSession.created_at,
                  role_title: mockSession.role_title,
                  company_name: mockSession.company_name,
                  status: mockSession.status,
                  interview_analyses: [],
                },
              ],
              error: null,
            })),
          })),
        })),
      })),
    } as any));

    const response = await listSessions(mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].scores).toBeNull();
  });

  it('should handle database errors', async () => {
    const supabaseModule = await vi.importMock<typeof import('../utils/supabase')>('../utils/supabase');
    supabaseModule.getSupabaseClient = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' },
            })),
          })),
        })),
      })),
    } as any));

    const response = await listSessions(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to list sessions');
  });
});
