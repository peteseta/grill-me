/**
 * Unit tests for lifeline.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLifeline } from './lifeline';

// Mock the lifeline service
vi.mock('../services/lifeline', () => ({
  generateLifelineAdvice: vi.fn(() => Promise.resolve({
    advice: 'Focus on specific technical details rather than vague statements.',
    suggested_opening: 'Let me walk you through the specific architecture decisions...',
  })),
}));

describe('handleLifeline', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        param: vi.fn(() => 'test-session-id'),
        json: vi.fn(),
      },
      env: {
        OPENAI_API_KEY: 'test-key',
      },
    };
  });

  it('should return not implemented error (current behavior)', async () => {
    mockContext.req.json = vi.fn(() => Promise.resolve({
      transcript_history: [
        { role: 'agent', text: 'Tell me about your experience with React.' },
        { role: 'user', text: 'I have worked with React for many years.' },
      ],
    }));

    const response = await handleLifeline(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Lifeline not yet implemented');
  });

  it('should handle errors gracefully', async () => {
    mockContext.req.json = vi.fn(() => Promise.reject(new Error('Invalid JSON')));

    const response = await handleLifeline(mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    // Current implementation returns "Lifeline not yet implemented" for all errors
    expect(data.error).toBe('Lifeline not yet implemented');
  });
});
