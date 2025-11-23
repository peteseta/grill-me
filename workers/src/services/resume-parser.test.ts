/**
 * Unit tests for resume-parser.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseResume } from './resume-parser';
import { Env } from '../types/env';

const mockResumeText = `John Doe
john@example.com
555-1234

SKILLS
React, TypeScript, Node.js

EXPERIENCE
Senior Software Engineer at Tech Corp
2020-2023
Built scalable web applications

EDUCATION
MIT - BS Computer Science (2020)`;

const mockParsedData = {
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

const mockOpenAIResponse = {
  output_parsed: mockParsedData,
};

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn((config) => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() =>
        Promise.resolve({
          getTextContent: vi.fn(() =>
            Promise.resolve({
              items: [
                { str: 'John Doe' },
                { str: 'john@example.com' },
                { str: 'React Developer' },
              ],
            })
          ),
        })
      ),
    }),
  })),
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(() => Promise.resolve({ value: mockResumeText })),
  },
}));

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

describe('parseResume', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      OPENAI_API_KEY: 'test-openai-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    vi.clearAllMocks();
  });

  it('should parse PDF resume successfully', async () => {
    const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

    const result = await parseResume(mockFile, mockEnv);

    expect(result).toBeDefined();
    expect(result.candidate_name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.phone).toBe('555-1234');
    expect(result.skills).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result.raw_text).toBeDefined();
  });

  it('should parse DOCX resume successfully', async () => {
    const mockFile = new File(['docx content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const result = await parseResume(mockFile, mockEnv);

    expect(result).toBeDefined();
    expect(result.candidate_name).toBe('John Doe');
  });

  it('should parse TXT resume successfully', async () => {
    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    const result = await parseResume(mockFile, mockEnv);

    expect(result).toBeDefined();
    expect(result.candidate_name).toBe('John Doe');
  });

  it('should detect file type from extension when MIME type is generic', async () => {
    const mockFile = new File(['content'], 'resume.pdf', { type: 'application/octet-stream' });

    const result = await parseResume(mockFile, mockEnv);

    expect(result).toBeDefined();
  });

  it('should throw error for unsupported file type', async () => {
    const mockFile = new File(['content'], 'resume.jpg', { type: 'image/jpeg' });

    await expect(parseResume(mockFile, mockEnv)).rejects.toThrow(
      'Unsupported file type: image/jpeg'
    );
  });

  it('should throw error if extracted text is empty', async () => {
    const mockFile = new File([''], 'resume.txt', { type: 'text/plain' });

    await expect(parseResume(mockFile, mockEnv)).rejects.toThrow(
      'Failed to extract text from resume file'
    );
  });

  it('should throw error if OPENAI_API_KEY is missing', async () => {
    mockEnv.OPENAI_API_KEY = '';
    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    await expect(parseResume(mockFile, mockEnv)).rejects.toThrow(
      'OPENAI_API_KEY is required for resume parsing'
    );
  });

  it('should throw error if OpenAI returns empty response', async () => {
    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve({ output_parsed: null })),
      },
    } as any));

    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    await expect(parseResume(mockFile, mockEnv)).rejects.toThrow('OpenAI returned empty response');
  });

  it('should use gpt-5-nano model for parsing', async () => {
    const OpenAI = (await import('openai')).default;
    const mockParse = vi.fn(() => Promise.resolve(mockOpenAIResponse));

    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: mockParse,
      },
    } as any));

    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    await parseResume(mockFile, mockEnv);

    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-nano',
      })
    );
  });

  it('should handle optional fields being undefined', async () => {
    const minimalParsedData = {
      candidate_name: 'John Doe',
    };

    const OpenAI = (await import('openai')).default;
    vi.mocked(OpenAI).mockImplementationOnce(() => ({
      responses: {
        parse: vi.fn(() => Promise.resolve({ output_parsed: minimalParsedData })),
      },
    } as any));

    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    const result = await parseResume(mockFile, mockEnv);

    expect(result).toBeDefined();
    expect(result.candidate_name).toBe('John Doe');
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });

  it('should include raw text in result', async () => {
    const mockFile = new File([mockResumeText], 'resume.txt', { type: 'text/plain' });

    const result = await parseResume(mockFile, mockEnv);

    expect(result.raw_text).toBe(mockResumeText);
  });
});
