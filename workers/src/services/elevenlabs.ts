/**
 * ElevenLabs API service
 * Handles communication with ElevenLabs for conversation transcripts
 */

import { Env } from '../types/env';
import { TranscriptMessage } from '../types/database';
import { getSupabaseClient } from '../utils/supabase';

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
 * Fetch the audio recording from ElevenLabs and store it in Supabase Storage
 *
 * @param conversationId - The ElevenLabs conversation ID
 * @param env - Environment variables for API keys
 * @returns Public URL to the audio file in Supabase storage, or null if upload fails
 *
 * API endpoint: GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio
 * Headers: xi-api-key: {ELEVENLABS_API_KEY}
 */
export async function saveAndFetchAudioUrl(
  conversationId: string,
  env: Env
): Promise<string | null> {
  try {
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

    // Get the audio data as blob
    const audioBlob = await response.blob();

    // Initialize Supabase client
    const supabase = getSupabaseClient(env);

    // Generate a unique path for Supabase storage
    const storagePath = `conversations/${conversationId}.mp3`;

    // Upload to Supabase storage bucket 'audio'
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true, // Overwrite if already exists
      });

    if (uploadError) {
      console.error('Error uploading audio to Supabase:', uploadError);
      return null;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(storagePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error fetching/uploading audio:', error);
    return null;
  }
}
