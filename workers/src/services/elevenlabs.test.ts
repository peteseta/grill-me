/**
 * Unit tests for elevenlabs.ts
 * Run with: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTranscript, fetchAudioUrl } from './elevenlabs';
import { Env } from '../types/env';

const mockConversationId = 'conv-123';

const mockElevenLabsTranscript = {
  transcript: [
    {
      role: 'agent' as const,
      time_in_call_secs: 0,
      message: 'Hello, how are you?',
    },
    {
      role: 'user' as const,
      time_in_call_secs: 5,
      message: 'I am doing well, thanks!',
    },
    {
      role: 'agent' as const,
      time_in_call_secs: 10,
      message: null, // Test null handling
    },
    {
      role: 'user' as const,
      time_in_call_secs: 15,
      message: '',
    },
  ],
};

// Mock global fetch
global.fetch = vi.fn();

// Mock Supabase
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://storage.example.com/audio/conv-123.mp3' },
        })),
      })),
    },
  })),
}));

describe('fetchTranscript', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      ELEVENLABS_API_KEY: 'test-elevenlabs-key',
      OPENAI_API_KEY: 'test-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    vi.clearAllMocks();
  });

  it('should fetch and transform transcript successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockElevenLabsTranscript,
    } as Response);

    const result = await fetchTranscript(mockConversationId, mockEnv);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.elevenlabs.io/v1/convai/conversations/${mockConversationId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': 'test-elevenlabs-key',
        },
      }
    );

    expect(result).toHaveLength(2); // Only non-empty messages
    expect(result[0]).toEqual({
      index: 0,
      role: 'agent',
      text: 'Hello, how are you?',
      timestamp: 0,
    });
    expect(result[1]).toEqual({
      index: 1,
      role: 'user',
      text: 'I am doing well, thanks!',
      timestamp: 5,
    });
  });

  it('should filter out empty messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockElevenLabsTranscript,
    } as Response);

    const result = await fetchTranscript(mockConversationId, mockEnv);

    // Should only have 2 messages (filtered out null and empty)
    expect(result).toHaveLength(2);
    expect(result.every(msg => msg.text.trim() !== '')).toBe(true);
  });

  it('should throw error on API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchTranscript(mockConversationId, mockEnv)).rejects.toThrow(
      'ElevenLabs API error: 404 Not Found'
    );
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTranscript(mockConversationId, mockEnv)).rejects.toThrow('Network error');
  });
});

describe('fetchAudioUrl', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      ELEVENLABS_API_KEY: 'test-elevenlabs-key',
      OPENAI_API_KEY: 'test-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent-123',
    };

    vi.clearAllMocks();
  });

  it('should fetch audio and upload to Supabase successfully', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const result = await fetchAudioUrl(mockConversationId, mockEnv);

    expect(fetch).toHaveBeenCalledWith(
      `https://api.elevenlabs.io/v1/convai/conversations/${mockConversationId}/audio`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': 'test-elevenlabs-key',
        },
      }
    );

    expect(result).toBe('https://storage.example.com/audio/conv-123.mp3');
  });

  it('should return null on ElevenLabs API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchAudioUrl(mockConversationId, mockEnv);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return null on Supabase upload failure', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    // Mock Supabase upload error - reimport to get fresh mock
    const supabaseModule = await vi.importMock<typeof import('../utils/supabase')>('../utils/supabase');
    supabaseModule.getSupabaseClient = vi.fn(() => ({
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ error: { message: 'Upload failed' } })),
        })),
      },
    } as any));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchAudioUrl(mockConversationId, mockEnv);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return null on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchAudioUrl(mockConversationId, mockEnv);

    // Network error is caught and null is returned
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should use correct Supabase storage path', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const mockUpload = vi.fn(() => Promise.resolve({ error: null }));
    const supabaseModule = await vi.importMock<typeof import('../utils/supabase')>('../utils/supabase');
    supabaseModule.getSupabaseClient = vi.fn(() => ({
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://storage.example.com/audio/conv-123.mp3' },
          })),
        })),
      },
    } as any));

    await fetchAudioUrl(mockConversationId, mockEnv);

    expect(mockUpload).toHaveBeenCalledWith(
      `conversations/${mockConversationId}.mp3`,
      mockBlob,
      {
        contentType: 'audio/mpeg',
        upsert: true,
      }
    );
  });
});
