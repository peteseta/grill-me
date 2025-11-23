/**
 * Lifeline route
 * POST /api/v1/sessions/{session_id}/lifeline
 */

import { Context } from 'hono';
import { Env } from '../types/env';
import { LifelineRequest, LifelineResponse } from '../types/api';
import { generateLifelineAdvice } from '../services/lifeline';
import { success, badRequest } from '../utils/response';

/**
 * POST /api/v1/sessions/{session_id}/lifeline
 * Provide real-time assistance during the interview
 *
 * Note: This endpoint should be fast (< 2 seconds) to provide real-time help
 */
export async function handleLifeline(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Get session_id from URL params
    const sessionId = c.req.param('session_id');
    if (!sessionId) {
      return badRequest('Missing session_id');
    }

    // Parse request body
    const body = await c.req.json<LifelineRequest>();
    if (!body.transcript_history || body.transcript_history.length === 0) {
      return badRequest('Missing or empty transcript_history');
    }

    // Generate lifeline advice
    const response = await generateLifelineAdvice(body, c.env);

    return success(response);
  } catch (error) {
    console.error('Error generating lifeline advice:', error);
    return badRequest(`Failed to generate lifeline advice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
