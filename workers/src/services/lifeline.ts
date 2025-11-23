/**
 * Lifeline service
 * Provides real-time assistance to users during the interview
 */

import { Env } from '../types/env';
import { LifelineRequest, LifelineResponse } from '../types/api';

/**
 * Generate real-time advice for the user based on the conversation history
 *
 * @param request - The lifeline request with transcript history
 * @param env - Environment variables for API keys
 * @returns Advice and suggested opening
 *
 * TODO: Implement lifeline advice generation
 * - Analyze the recent conversation context
 * - Identify what the interviewer is testing (e.g., technical depth, business judgment)
 * - Provide tactical advice on how to answer
 * - Suggest a strong opening line to recover
 * - Keep advice concise and actionable (1-2 sentences)
 *
 * Example prompt strategy:
 * - "You are an interview coach. The candidate is stuck."
 * - "Based on the interviewer's question, what are they really testing?"
 * - "Provide tactical advice and a suggested opening line."
 */
export async function generateLifelineAdvice(
  request: LifelineRequest,
  env: Env
): Promise<LifelineResponse> {
  // TODO: Implement lifeline advice generation
  // 1. Construct prompt with conversation history
  // 2. Call fast LLM API (GPT-4o-mini or Claude Haiku for speed)
  // 3. Parse response into advice and suggested opening
  // 4. Return LifelineResponse

  throw new Error('Lifeline advice generation not yet implemented');
}
