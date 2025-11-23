/**
 * Unit tests for interview-analyzer.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeInterview, AnalysisInput } from './interview-analyzer';
import { Env } from '@/types';
import { TranscriptMessage } from '@/types';

const mockTranscript: TranscriptMessage[] = [
  {
    index: 0,
    role: 'agent',
    text: 'Tell me about your React experience.',
    timestamp: 0,
  },
  {
    index: 1,
    role: 'user',
    text: 'I have extensive experience leveraging synergies with React components.',
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

const mockAnalysisResponse = {
  output_parsed: {
    score_overall: 7,
    score_bullshit: 45,
    score_technical: 75,
    summary_feedback: 'Good technical depth with some buzzword usage.',
    structured_feedback: [
      {
        target_message_index: 1,
        exact_quote: 'leveraging synergies',
        type: 'negative' as const,
        category: 'buzzword_stuffing',
        feedback: 'Avoid vague buzzwords. Be specific about what you did.',
      },
      {
        target_message_index: 3,
        exact_quote: 'useState and useEffect hooks',
        type: 'positive' as const,
        category: 'technical_depth',
        feedback: 'Good specific technical details.',
      },
    ],
  },
};

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(mockAnalysisResponse)),
      },
    })),
  };
});

describe('analyzeInterview', () => {
  let mockEnv: Env;
  let mockInput: AnalysisInput;

  beforeEach(() => {
    mockEnv = {
      OPENAI_API_KEY: 'test-openai-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    mockInput = {
      transcript: mockTranscript,
      jobDescription: 'Looking for Senior Frontend Engineer',
      roleTitle: 'Senior Frontend Engineer',
      interviewType: 'Technical',
    };

    vi.clearAllMocks();
  });

  it('should analyze interview successfully', async () => {
    const result = await analyzeInterview(mockInput, mockEnv);

    expect(result).toBeDefined();
    expect(result.score_overall).toBe(7);
    expect(result.score_bullshit).toBe(45);
    expect(result.score_technical).toBe(75);
    expect(result.summary_feedback).toBe('Good technical depth with some buzzword usage.');
    expect(result.structured_feedback).toHaveLength(2);
  });

  it('should throw error if OPENAI_API_KEY is missing', async () => {
    mockEnv.OPENAI_API_KEY = '';

    await expect(analyzeInterview(mockInput, mockEnv)).rejects.toThrow(
      'OPENAI_API_KEY is not configured'
    );
  });

  it('should handle OpenAI returning empty response', async () => {
    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve({ output_parsed: null })),
      },
    } as any));

    await expect(analyzeInterview(mockInput, mockEnv)).rejects.toThrow(
      'OpenAI returned empty response'
    );
  });

  it('should format transcript correctly for prompt', async () => {
    const OpenAI = (await import('openai')).default;
    const mockParse = vi.fn(() => Promise.resolve(mockAnalysisResponse));

    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: mockParse,
      },
    } as any));

    await analyzeInterview(mockInput, mockEnv);

    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.1',
        reasoning_effort: 'medium',
      })
    );
  });

  it('should handle different interview types', async () => {
    const behavioralInput = { ...mockInput, interviewType: 'Behavioral' as const };
    const result = await analyzeInterview(behavioralInput, mockEnv);

    expect(result).toBeDefined();
  });

  it('should validate quotes against transcript', async () => {
    // Create a mock with an invalid quote
    const invalidResponse = {
      output_parsed: {
        ...mockAnalysisResponse.output_parsed,
        structured_feedback: [
          {
            target_message_index: 1,
            exact_quote: 'this quote does not exist',
            type: 'negative' as const,
            category: 'test',
            feedback: 'test',
          },
        ],
      },
    };

    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(invalidResponse)),
      },
    } as any));

    // Should not throw, but will log warning
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await analyzeInterview(mockInput, mockEnv);

    expect(result).toBeDefined();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should warn when message index not found in transcript', async () => {
    const invalidResponse = {
      output_parsed: {
        ...mockAnalysisResponse.output_parsed,
        structured_feedback: [
          {
            target_message_index: 999,
            exact_quote: 'test',
            type: 'negative' as const,
            category: 'test',
            feedback: 'test',
          },
        ],
      },
    };

    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(invalidResponse)),
      },
    } as any));

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await analyzeInterview(mockInput, mockEnv);

    expect(result).toBeDefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Message index 999 not found')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle all feedback types (positive, negative, warning)', async () => {
    const multiTypeResponse = {
      output_parsed: {
        ...mockAnalysisResponse.output_parsed,
        structured_feedback: [
          {
            target_message_index: 1,
            exact_quote: 'leveraging synergies',
            type: 'negative' as const,
            category: 'buzzword_stuffing',
            feedback: 'Avoid buzzwords',
          },
          {
            target_message_index: 3,
            exact_quote: 'useState',
            type: 'positive' as const,
            category: 'technical_depth',
            feedback: 'Good technical detail',
          },
          {
            target_message_index: 1,
            exact_quote: 'extensive experience',
            type: 'warning' as const,
            category: 'vagueness',
            feedback: 'Quantify your experience',
          },
        ],
      },
    };

    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve(multiTypeResponse)),
      },
    } as any));

    const result = await analyzeInterview(mockInput, mockEnv);

    expect(result.structured_feedback).toHaveLength(3);
    expect(result.structured_feedback.some(f => f.type === 'positive')).toBe(true);
    expect(result.structured_feedback.some(f => f.type === 'negative')).toBe(true);
    expect(result.structured_feedback.some(f => f.type === 'warning')).toBe(true);
  });
});
