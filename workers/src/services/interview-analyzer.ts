/**
 * Interview analysis service
 * Uses LLM to analyze interview transcript and generate feedback
 */

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Env } from '../types/env';
import { TranscriptMessage, StructuredFeedbackItem } from '../types/database';

export interface AnalysisResult {
  score_overall: number; // 1-10
  score_bullshit: number; // 0-100 (high = bad)
  score_technical: number; // 0-100 (high = good)
  summary_feedback: string;
  structured_feedback: StructuredFeedbackItem[];
}

export interface AnalysisInput {
  transcript: TranscriptMessage[];
  jobDescription: string;
  roleTitle: string;
  interviewType: 'Technical' | 'Behavioral' | 'Mixed';
}

/**
 * Zod schema for structured output from GPT-5.1
 * Defines the expected interview analysis structure
 */
const StructuredFeedbackItemSchema = z.object({
  target_message_index: z.number().describe('Index of the message being annotated'),
  exact_quote: z.string().describe('EXACT text from the transcript to highlight'),
  type: z.enum(['positive', 'negative', 'warning']).describe('Type of annotation: positive (green), negative (red), or warning (yellow)'),
  category: z.string().describe('Category like buzzword_stuffing, vagueness, concrete_metric, good_structure, etc.'),
  feedback: z.string().describe('Specific actionable feedback for this annotation'),
});

const AnalysisResultSchema = z.object({
  score_overall: z.number().min(1).max(10).describe('Overall interview performance score from 1-10'),
  score_bullshit: z.number().min(0).max(100).describe('Buzzword/vagueness score 0-100, higher means more BS'),
  score_technical: z.number().min(0).max(100).describe('Technical depth score 0-100, higher means better technical understanding'),
  summary_feedback: z.string().describe('Overall performance summary and key improvement areas'),
  structured_feedback: z.array(StructuredFeedbackItemSchema).describe('Array of specific annotations highlighting good and bad parts of responses'),
});

/**
 * Analyze the interview transcript and generate detailed feedback
 *
 * Uses OpenAI's GPT-5.1 with medium reasoning effort to analyze the candidate's responses for:
 * 1. Buzzword usage and vagueness (score_bullshit)
 * 2. Technical depth and accuracy (score_technical)
 * 3. Overall interview performance (score_overall)
 *
 * Generates structured feedback that highlights specific quotes and categorizes
 * them as positive, negative, or warning with actionable improvement suggestions.
 * Uses structured outputs to ensure reliable JSON schema conformance.
 *
 * @param input - Transcript and interview context
 * @param env - Environment variables for API keys
 * @returns Analysis with scores and structured feedback
 */
export async function analyzeInterview(
  input: AnalysisInput,
  env: Env
): Promise<AnalysisResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  // Format transcript for the LLM
  const formattedTranscript = formatTranscriptForPrompt(input.transcript);

  // Construct the prompt
  const userPrompt = buildAnalysisPrompt(
    formattedTranscript,
    input.jobDescription,
    input.roleTitle,
    input.interviewType
  );

  // Call OpenAI API with structured outputs
  const response = await openai.responses.parse({
    model: 'gpt-5.1',
    reasoning_effort: 'medium',
    input: [
      {
        role: 'system',
        content: 'You are an expert Interview Critic. Analyze interview transcripts and provide detailed, actionable feedback with specific annotations.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    text: {
      format: zodTextFormat(AnalysisResultSchema, 'interview_analysis'),
    },
  });

  // Extract the parsed analysis
  const parsedResponse = response.output_parsed;

  if (!parsedResponse) {
    throw new Error('OpenAI returned empty response');
  }

  // Validate exact quotes match transcript text
  validateQuotes(parsedResponse.structured_feedback, input.transcript);

  return parsedResponse;
}

/**
 * Format transcript messages into a readable string for the LLM
 */
function formatTranscriptForPrompt(transcript: TranscriptMessage[]): string {
  return transcript
    .map((msg) => {
      const speaker = msg.role === 'agent' ? 'Interviewer' : 'Candidate';
      return `[Message ${msg.index}] ${speaker}: ${msg.text}`;
    })
    .join('\n\n');
}

/**
 * Build the analysis prompt - simplified for structured outputs
 * Schema enforcement handles the structure
 */
function buildAnalysisPrompt(
  formattedTranscript: string,
  jobDescription: string,
  roleTitle: string,
  interviewType: string
): string {
  return `Analyze this interview transcript and provide detailed feedback with specific annotations.

Interview Context:
- Role: ${roleTitle}
- Interview Type: ${interviewType}
- Job Description: ${jobDescription}

Analysis Requirements:
1. **Identify Specific Phrases:** Find phrases that are 'positive' (green), 'negative' (red), or 'warning' (yellow).
2. **Exact Quotes:** Quote the text EXACTLY as it appears in the transcript for highlighting.
3. **Use 'negative' for:** Buzzwords, lies, rambling, avoiding the question, vague claims.
4. **Use 'positive' for:** Specific metrics, clear structure (STAR method), admitting mistakes honestly, technical depth.
5. **Use 'warning' for:** Vague language, missing details, unclear explanations, potential exaggerations.
6. **Categories:** Assign categories like: 'buzzword_stuffing', 'vagueness', 'concrete_metric', 'good_structure', 'technical_depth', 'evasion', etc.

Scoring Guidelines:
- **score_overall (1-10):** Overall interview performance
- **score_bullshit (0-100):** Higher means more buzzwords/vagueness/BS
- **score_technical (0-100):** Higher means better technical depth and accuracy

Input Transcript:
${formattedTranscript}

Provide comprehensive analysis with specific annotations highlighting both strengths and weaknesses.`;
}


/**
 * Validate that exact quotes exist in the transcript
 */
function validateQuotes(
  structuredFeedback: StructuredFeedbackItem[],
  transcript: TranscriptMessage[]
): void {
  for (const item of structuredFeedback) {
    // Find the message by index
    const message = transcript.find((msg) => msg.index === item.target_message_index);

    if (!message) {
      console.warn(
        `Warning: Message index ${item.target_message_index} not found in transcript for quote: "${item.exact_quote}"`
      );
      continue;
    }

    // Check if the exact quote exists in the message text
    if (!message.text.includes(item.exact_quote)) {
      console.warn(
        `Warning: Exact quote "${item.exact_quote}" not found in message ${item.target_message_index}: "${message.text}"`
      );
    }
  }
}
