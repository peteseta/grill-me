/**
 * Lifeline service
 * Provides real-time assistance to users during the interview
 */

import OpenAI from 'openai';
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
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  // 1. Construct prompt with conversation history
  const conversationContext = request.transcript_history
    .map((msg) => `${msg.role === 'agent' ? 'Interviewer' : 'Candidate'}: ${msg.text}`)
    .join('\n');

  const systemPrompt = `You are an expert interview coach. A candidate is stuck in a job interview and needs immediate tactical advice.

Your task:
1. Analyze what the interviewer is really testing (e.g., technical depth, business judgment, leadership)
2. Provide concise tactical advice on how to answer (1-2 sentences max)
3. Suggest a strong opening line to help the candidate recover

Respond in JSON format with this exact structure:
{
  "advice": "Brief tactical advice here",
  "suggested_opening": "A strong opening line here"
}`;

  const userPrompt = `Based on this interview conversation, what should the candidate do?

${conversationContext}

Provide tactical advice and a suggested opening line in JSON format.`;

  // 2. Call OpenAI API (GPT-4o-mini for speed)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OpenAI API');
  }

  // 3. Parse response into advice and suggested opening
  const parsed = JSON.parse(content);

  // 4. Return LifelineResponse
  return {
    advice: parsed.advice || 'Focus on providing specific examples and concrete details.',
    suggested_opening:
      parsed.suggested_opening || 'Let me give you a specific example...',
  };
}
