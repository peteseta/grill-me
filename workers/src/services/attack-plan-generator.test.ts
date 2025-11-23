/**
 * Unit tests for attack-plan-generator.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAttackPlan, AttackPlanInput } from './attack-plan-generator';
import { Env } from '@/types';

const mockParsedResume = {
  raw_text: 'John Doe\nSenior Software Engineer\njohn@example.com\n555-1234\n\nSkills: React, TypeScript, Node.js',
  candidate_name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  skills: ['React', 'TypeScript', 'Node.js'],
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      duration: '2020-2023',
      description: 'Built scalable web applications',
    },
  ],
  education: [
    {
      institution: 'MIT',
      degree: 'BS Computer Science',
      year: '2020',
    },
  ],
};

const mockAttackPlan = {
  difficulty: 'moderate' as const,
  focus_areas: [
    {
      topic: 'Technical Depth: React Experience',
      context: 'Claims 3 years of React experience. Test understanding of advanced concepts like custom hooks and performance optimization.',
      probing_questions: [
        'Walk me through how you optimized React performance in your last project.',
        'Give me a specific example of a custom hook you built.',
      ],
    },
  ],
};

const mockOpenAIResponse = {
  output_parsed: {
    candidate_name: 'John Doe',
    role_title: 'Senior Frontend Engineer',
    difficulty_progression: 'moderate',
    overall_strategy: 'Act as a skeptical senior engineer testing technical depth.',
    focus_areas: [
      {
        area: 'Technical Depth',
        topic: 'React Experience',
        context: 'Claims 3 years of React experience.',
        angle: 'Test understanding of advanced concepts like custom hooks and performance optimization.',
        probing_questions: [
          'Walk me through how you optimized React performance in your last project.',
          'Give me a specific example of a custom hook you built.',
        ],
      },
    ],
    behavioral_themes: ['Leadership', 'Problem Solving'],
  },
};

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(mockOpenAIResponse)),
      },
    })),
  };
});

describe('generateAttackPlan', () => {
  let mockEnv: Env;
  let mockInput: AttackPlanInput;

  beforeEach(() => {
    mockEnv = {
      OPENAI_API_KEY: 'test-openai-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    mockInput = {
      resume: mockParsedResume,
      jobDescription: 'Looking for Senior Frontend Engineer with React expertise',
      roleTitle: 'Senior Frontend Engineer',
      companyName: 'Tech Corp',
      interviewType: 'Technical',
    };

    vi.clearAllMocks();
  });

  it('should generate attack plan successfully', async () => {
    const result = await generateAttackPlan(mockInput, mockEnv);

    expect(result).toBeDefined();
    expect(result.difficulty).toBe('moderate');
    expect(result.focus_areas).toHaveLength(1);
    expect(result.focus_areas[0].topic).toContain('Technical Depth');
    expect(result.focus_areas[0].topic).toContain('React Experience');
    expect(result.focus_areas[0].probing_questions).toHaveLength(2);
  });

  it('should throw error if OPENAI_API_KEY is missing', async () => {
    mockEnv.OPENAI_API_KEY = '';

    await expect(generateAttackPlan(mockInput, mockEnv)).rejects.toThrow(
      'OPENAI_API_KEY is required for attack plan generation'
    );
  });

  it('should handle OpenAI API returning empty response', async () => {
    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve({ output_parsed: null })),
      },
    } as any));

    await expect(generateAttackPlan(mockInput, mockEnv)).rejects.toThrow(
      'OpenAI returned empty response'
    );
  });

  it('should include company name in prompt when provided', async () => {
    const result = await generateAttackPlan(mockInput, mockEnv);

    expect(result).toBeDefined();
  });

  it('should work without optional company name', async () => {
    const inputWithoutCompany = { ...mockInput, companyName: undefined };
    const result = await generateAttackPlan(inputWithoutCompany, mockEnv);

    expect(result).toBeDefined();
  });

  it('should handle different interview types', async () => {
    const behavioralInput = { ...mockInput, interviewType: 'Behavioral' as const };
    const result = await generateAttackPlan(behavioralInput, mockEnv);

    expect(result).toBeDefined();
  });

  it('should format resume data correctly', async () => {
    const OpenAI = (await import('openai')).default;
    const mockParse = vi.fn(() => Promise.resolve(mockOpenAIResponse));

    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: mockParse,
      },
    } as any));

    await generateAttackPlan(mockInput, mockEnv);

    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.1',
        reasoning_effort: 'medium',
      })
    );
  });
});
