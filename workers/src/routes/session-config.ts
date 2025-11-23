/**
 * Session configuration route
 * GET /api/v1/sessions/{session_id}/config
 */

import { Context } from 'hono';
import { Env } from '../types/env';
import { SessionConfigResponse } from '../types/api';
import { getSupabaseClient } from '../utils/supabase';
import { success, notFound, badRequest } from '../utils/response';

/**
 * GET /api/v1/sessions/{session_id}/config
 * Get ElevenLabs configuration for starting the interview
 */
export async function getSessionConfig(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Get session_id from URL params
    const sessionId = c.req.param('session_id');
    if (!sessionId) {
      return badRequest('Missing session_id');
    }

    // Query session from database
    const supabase = getSupabaseClient(c.env);
    const result: any = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (result.error || !result.data) {
      return notFound('Session not found');
    }

    const session = result.data;

    // Verify session is ready
    if (session.status !== 'ready' && session.status !== 'in_progress') {
      return badRequest('Session is not ready');
    }

    // Extract candidate name from resume (simple heuristic or use parsed data)
    const candidateName = extractCandidateName(session.resume_text) || 'Candidate';

    // Build response
    const response: SessionConfigResponse = {
      agent_id: c.env.ELEVENLABS_AGENT_ID,
      dynamic_variables: {
        ROLE_TITLE: session.role_title,
        CANDIDATE_NAME: candidateName,
        COMPANY_NAME: session.company_name || 'the company',
        INTERVIEW_TYPE: session.interview_type,
        ATTACK_PLAN_JSON: session.attack_plan,
        RESUME_TEXT: session.resume_text || '',
      },
    };

    // Update session status to 'in_progress' if it was 'ready'
    if (session.status === 'ready') {
      await (supabase as any)
        .from('interview_sessions')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    return success(response);
  } catch (error) {
    console.error('Error getting session config:', error);
    return badRequest(`Failed to get session config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to extract candidate name from resume text
 * Uses a simple heuristic: looks for the first line with 2-4 capitalized words
 */
function extractCandidateName(resumeText?: string): string | null {
  if (!resumeText) return null;

  // Simple heuristic: take first line or first capitalized words
  const lines = resumeText.trim().split('\n');
  const firstLine = lines[0]?.trim();

  if (!firstLine) return null;

  // If first line looks like a name (2-4 words, all capitalized)
  const words = firstLine.split(/\s+/);
  if (words.length >= 2 && words.length <= 4) {
    const allCapitalized = words.every(w => /^[A-Z]/.test(w));
    if (allCapitalized) {
      return words.slice(0, 2).join(' '); // Return first two words as name
    }
  }

  return null;
}
