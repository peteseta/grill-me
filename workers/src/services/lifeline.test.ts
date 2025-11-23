/**
 * Unit tests for lifeline.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLifelineAdvice } from './lifeline';
import { Env } from '../types/env';
import { LifelineRequest } from '../types/api';

const mockLifelineResponse = {
  output_parsed: {
    advice: 'Focus on specific technical details and metrics rather than vague statements.',
    suggested_opening: 'Let me walk you through the specific architecture decisions I made...',
  },
};

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(mockLifelineResponse)),
      },
    })),
  };
});

describe('generateLifelineAdvice', () => {
  let mockEnv: Env;
  let mockRequest: LifelineRequest;

  beforeEach(() => {
    mockEnv = {
      OPENAI_API_KEY: 'test-openai-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    mockRequest = {
      transcript_history: [
        {
          role: 'agent',
          text: 'Tell me about your experience with microservices architecture.',
        },
        {
          role: 'user',
          text: 'I have worked with microservices and they are very scalable.',
        },
        {
          role: 'agent',
          text: 'Can you give a specific example of a challenge you faced?',
        },
      ],
    };

    vi.clearAllMocks();
  });

  it('should generate lifeline advice successfully', async () => {
    const result = await generateLifelineAdvice(mockRequest, mockEnv);

    expect(result).toBeDefined();
    expect(result.advice).toBe(
      'Focus on specific technical details and metrics rather than vague statements.'
    );
    expect(result.suggested_opening).toBe(
      'Let me walk you through the specific architecture decisions I made...'
    );
  });

  it('should throw error if OPENAI_API_KEY is missing', async () => {
    mockEnv.OPENAI_API_KEY = '';

    await expect(generateLifelineAdvice(mockRequest, mockEnv)).rejects.toThrow(
      'OPENAI_API_KEY is not configured'
    );
  });

  it('should throw error if OpenAI returns empty response', async () => {
    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve({ output_parsed: null })),
      },
    } as any));

    await expect(generateLifelineAdvice(mockRequest, mockEnv)).rejects.toThrow(
      'OpenAI returned empty response'
    );
  });

  it('should use GPT-5.1 with none reasoning effort for speed', async () => {
    const OpenAI = (await import('openai')).default;
    const mockParse = vi.fn(() => Promise.resolve(mockLifelineResponse));

    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: mockParse,
      },
    } as any));

    await generateLifelineAdvice(mockRequest, mockEnv);

    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.1',
        reasoning_effort: 'none',
      })
    );
  });

  it('should format transcript history correctly', async () => {
    const OpenAI = (await import('openai')).default;
    const mockParse = vi.fn(() => Promise.resolve(mockLifelineResponse));

    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: mockParse,
      },
    } as any));

    await generateLifelineAdvice(mockRequest, mockEnv);

    const call = mockParse.mock.calls[0][0];
    const userMessage = call.input.find((msg: any) => msg.role === 'user');

    expect(userMessage.content).toContain('Interviewer:');
    expect(userMessage.content).toContain('Candidate:');
    expect(userMessage.content).toContain('Tell me about your experience with microservices');
  });

  it('should handle single message in transcript', async () => {
    mockRequest.transcript_history = [
      {
        role: 'agent',
        text: 'Tell me about yourself.',
      },
    ];

    const result = await generateLifelineAdvice(mockRequest, mockEnv);

    expect(result).toBeDefined();
  });

  it('should handle long conversation history', async () => {
    mockRequest.transcript_history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('agent' as const) : ('user' as const),
      text: `Message ${i}`,
    }));

    const result = await generateLifelineAdvice(mockRequest, mockEnv);

    expect(result).toBeDefined();
  });

  it('should provide tactical advice for different scenarios', async () => {
    const scenarios = [
      {
        advice: 'Break down the problem into specific steps.',
        suggested_opening: 'Let me start by outlining the key challenges...',
      },
      {
        advice: 'Use the STAR method: Situation, Task, Action, Result.',
        suggested_opening: 'In my previous role at...',
      },
    ];

    for (const scenario of scenarios) {
      const OpenAI = (await import('openai')).default;
      vi.mocked(OpenAI).mockImplementationOnce(() => ({
        responses: {
          parse: vi.fn(() => Promise.resolve({ output_parsed: scenario })),
        },
      } as any));

      const result = await generateLifelineAdvice(mockRequest, mockEnv);

      expect(result.advice).toBe(scenario.advice);
      expect(result.suggested_opening).toBe(scenario.suggested_opening);
    }
  });
});
