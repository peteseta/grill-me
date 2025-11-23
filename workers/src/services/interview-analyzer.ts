/**
 * Interview analysis service
 * Uses LLM to analyze interview transcript and generate feedback
 */

import OpenAI from 'openai';
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
 * Analyze the interview transcript and generate detailed feedback
 *
 * Uses OpenAI's GPT-4o model to analyze the candidate's responses for:
 * 1. Buzzword usage and vagueness (score_bullshit)
 * 2. Technical depth and accuracy (score_technical)
 * 3. Overall interview performance (score_overall)
 *
 * Generates structured feedback that highlights specific quotes and categorizes
 * them as positive, negative, or warning with actionable improvement suggestions.
 *
 * @param input - Transcript and interview context
 * @param env - Environment variables for API keys
 * @returns Analysis with scores and structured feedback
 */
export async function analyzeInterview(
  input: AnalysisInput,
  env: Env
): Promise<AnalysisResult> {
  // 1. Format transcript for the LLM
  const formattedTranscript = formatTranscriptForPrompt(input.transcript);

  // 2. Construct the prompt
  const systemPrompt = buildAnalysisPrompt(
    formattedTranscript,
    input.jobDescription,
    input.roleTitle,
    input.interviewType
  );

  // 3. Call OpenAI API
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const llmResponse = await callOpenAI(systemPrompt, env.OPENAI_API_KEY);

  // 4. Parse and validate the response
  const parsedResponse = parseAnalysisResponse(llmResponse);

  // 5. Validate exact quotes match transcript text
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
 * Build the complete analysis prompt using the template from PROMPT_analysis.md
 */
function buildAnalysisPrompt(
  formattedTranscript: string,
  jobDescription: string,
  roleTitle: string,
  interviewType: string
): string {
  return `You are an Interview Critic. I will provide a transcript.
You must output a JSON object with metrics and an array of 'annotations'.

Interview Context:
- Role: ${roleTitle}
- Interview Type: ${interviewType}
- Job Description: ${jobDescription}

For the annotations:
1. You must identify specific phrases in the user's speech that are either 'positive' (green), 'negative' (red), or 'warning' (yellow).
2. You must quote the text EXACTLY as it appears in the transcript so my frontend can find-and-replace it with a highlight.
3. Use 'negative' for: Buzzwords, lies, rambling, avoiding the question.
4. Use 'positive' for: Specific metrics, clear structure (STAR method), admitting mistakes honestly.
5. Use 'warning' for: Vague language, missing details, unclear explanations.
6. Assign appropriate categories like: 'buzzword_stuffing', 'vagueness', 'concrete_metric', 'good_structure', etc.

Input Transcript:
${formattedTranscript}

Required Output Schema:
\`\`\`json
{
  "score_overall": <number 1-10>,
  "score_bullshit": <number 0-100, where higher means more buzzwords/BS>,
  "score_technical": <number 0-100, where higher means better technical depth>,
  "summary_feedback": "<string with overall performance summary>",
  "structured_feedback": [
    {
      "target_message_index": <number>,
      "exact_quote": "<string>",
      "type": "positive"|"negative"|"warning",
      "category": "<string>",
      "feedback": "<string>"
    }
  ]
}
\`\`\`

CRITICAL: Return ONLY the JSON object, no markdown formatting, no explanation text.`;
}

/**
 * Call OpenAI API (GPT-4o) using the official SDK
 */
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI API returned no content');
  }

  return content;
}

/**
 * Parse and validate the LLM response
 */
function parseAnalysisResponse(llmResponse: string): AnalysisResult {
  try {
    // Clean up potential markdown code blocks
    let cleanedResponse = llmResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const parsed = JSON.parse(cleanedResponse);

    // Validate required fields
    if (typeof parsed.score_overall !== 'number' || parsed.score_overall < 1 || parsed.score_overall > 10) {
      throw new Error('Invalid score_overall: must be between 1-10');
    }

    if (typeof parsed.score_bullshit !== 'number' || parsed.score_bullshit < 0 || parsed.score_bullshit > 100) {
      throw new Error('Invalid score_bullshit: must be between 0-100');
    }

    if (typeof parsed.score_technical !== 'number' || parsed.score_technical < 0 || parsed.score_technical > 100) {
      throw new Error('Invalid score_technical: must be between 0-100');
    }

    if (typeof parsed.summary_feedback !== 'string') {
      throw new Error('Invalid summary_feedback: must be a string');
    }

    if (!Array.isArray(parsed.structured_feedback)) {
      throw new Error('Invalid structured_feedback: must be an array');
    }

    // Validate each feedback item
    for (const item of parsed.structured_feedback) {
      if (typeof item.target_message_index !== 'number') {
        throw new Error('Invalid target_message_index: must be a number');
      }
      if (typeof item.exact_quote !== 'string') {
        throw new Error('Invalid exact_quote: must be a string');
      }
      if (!['positive', 'negative', 'warning'].includes(item.type)) {
        throw new Error('Invalid type: must be positive, negative, or warning');
      }
      if (typeof item.category !== 'string') {
        throw new Error('Invalid category: must be a string');
      }
      if (typeof item.feedback !== 'string') {
        throw new Error('Invalid feedback: must be a string');
      }
    }

    return parsed as AnalysisResult;
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
