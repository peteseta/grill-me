/**
 * ElevenLabs API service
 * Handles communication with ElevenLabs for conversation transcripts
 */

import { Env } from '../types/env';
import { TranscriptMessage } from '../types/database';

/**
 * Fetch the full conversation transcript from ElevenLabs
 *
 * @param conversationId - The ElevenLabs conversation ID
 * @param env - Environment variables for API keys
 * @returns Array of transcript messages with timestamps
 *
 * API endpoint: GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}
 * Headers: xi-api-key: {ELEVENLABS_API_KEY}
 */
export async function fetchTranscript(
  conversationId: string,
  env: Env
): Promise<TranscriptMessage[]> {
  const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json() as {
    transcript: Array<{
      role: 'user' | 'agent';
      time_in_call_secs: number;
      message?: string | null;
    }>;
  };

  // Transform ElevenLabs transcript format to our TranscriptMessage format
  const transcript: TranscriptMessage[] = data.transcript
    .map((turn, index) => ({
      index,
      role: turn.role,
      text: turn.message || '', // Handle null/undefined messages
      timestamp: turn.time_in_call_secs,
    }))
    .filter((msg) => msg.text.trim() !== ''); // Filter out empty messages

  return transcript;
}

/**
 * Fetch the audio recording from ElevenLabs and store it in R2
 *
 * @param conversationId - The ElevenLabs conversation ID
 * @param env - Environment variables for API keys
 * @returns R2 storage key for the audio file, or null if AUDIO_BUCKET is not configured
 *
 * API endpoint: GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio
 * Headers: xi-api-key: {ELEVENLABS_API_KEY}
 */
export async function fetchAudioUrl(
  conversationId: string,
  env: Env
): Promise<string | null> {
  // Check if R2 storage bucket is configured
  if (!env.AUDIO_BUCKET) {
    console.warn('AUDIO_BUCKET not configured, skipping audio storage');
    return null;
  }

  const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`;

  // Fetch the audio data from ElevenLabs
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs audio API error: ${response.status} ${response.statusText}`
    );
  }

  // Get the audio data as ArrayBuffer
  const audioData = await response.arrayBuffer();

  // Generate a unique key for R2 storage
  const audioKey = `conversations/${conversationId}.mp3`;

  // Upload to R2 bucket
  await env.AUDIO_BUCKET.put(audioKey, audioData, {
    httpMetadata: {
      contentType: 'audio/mpeg',
    },
  });

  // Return the R2 URL (this would need to be configured with a public domain)
  // For now, return the key that can be used to retrieve the file
  // In production, you'd configure R2 with a custom domain and return the full URL
  return audioKey;
}
