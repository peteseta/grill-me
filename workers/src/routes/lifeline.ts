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
 * TODO: Implement lifeline endpoint
 * - Extract session_id from URL parameters
 * - Parse request body to get transcript_history
 * - Validate transcript history is not empty
 * - Call lifeline service to generate advice
 * - Return advice and suggested opening
 *
 * Note: This endpoint should be fast (< 2 seconds) to provide real-time help
 */
export async function handleLifeline(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // TODO: Get session_id from URL params
    // const sessionId = c.req.param('session_id');

    // TODO: Parse request body
    // const body = await c.req.json<LifelineRequest>();
    // if (!body.transcript_history || body.transcript_history.length === 0) {
    //   return badRequest('Missing or empty transcript_history');
    // }

    // TODO: Generate lifeline advice
    // const response = await generateLifelineAdvice(body, c.env);

    // return success(response);

    return badRequest('Lifeline not yet implemented');
  } catch (error) {
    console.error('Error generating lifeline advice:', error);
    return badRequest('Failed to generate lifeline advice');
  }
}
