/**
 * Lifeline service
 * Provides real-time assistance to users during the interview
 */

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Env } from '../types/env';
import { LifelineRequest, LifelineResponse } from '../types/api';

/**
 * Zod schema for structured output from GPT-5.1
 * Defines the expected lifeline response structure
 */
const LifelineResponseSchema = z.object({
  advice: z.string().describe('Brief tactical advice (1-2 sentences max) on how to answer'),
  suggested_opening: z.string().describe('A strong opening line to help the candidate recover'),
});

/**
 * Generate real-time advice for the user based on the conversation history
 *
 * Uses GPT-5.1 with 'none' reasoning effort for ultra-fast responses during live interviews.
 * Structured outputs ensure reliable JSON conformance.
 *
 * @param request - The lifeline request with transcript history
 * @param env - Environment variables for API keys
 * @returns Advice and suggested opening
 */
export async function generateLifelineAdvice(
  request: LifelineRequest,
  env: Env
): Promise<LifelineResponse> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  // Construct prompt with conversation history
  const conversationContext = request.transcript_history
    .map((msg) => `${msg.role === 'agent' ? 'Interviewer' : 'Candidate'}: ${msg.text}`)
    .join('\n');

  const userPrompt = `You are an expert interview coach. A candidate is stuck in a job interview and needs immediate tactical advice.

Your task:
1. Analyze what the interviewer is really testing (e.g., technical depth, business judgment, leadership)
2. Provide concise tactical advice on how to answer (1-2 sentences max)
3. Suggest a strong opening line to help the candidate recover

Interview conversation so far:
${conversationContext}

Provide tactical advice and a suggested opening line.`;

  // Call OpenAI API with structured outputs (GPT-5.1 with 'none' reasoning for speed)
  const response = await openai.responses.parse({
    model: 'gpt-5.1',
    reasoning: {effort: 'none'},
    input: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    text: {
      format: zodTextFormat(LifelineResponseSchema, 'lifeline_advice'),
    },
  });

  const parsedResponse = response.output_parsed;

  if (!parsedResponse) {
    throw new Error('OpenAI returned empty response');
  }

  return parsedResponse;
}
