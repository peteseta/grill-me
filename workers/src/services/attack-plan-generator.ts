/**
 * Attack plan generation service
 * Uses LLM to generate interview strategy based on resume and job description
 */

import OpenAI from 'openai';
import { AttackPlan, ParsedResume } from '../types/database';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { Env } from '@/types';

export interface AttackPlanInput {
  resume: ParsedResume;
  jobDescription: string;
  roleTitle: string;
  companyName?: string;
  interviewType: 'Technical' | 'Behavioral' | 'Mixed';
}

/**
 * Zod schema for structured output from GPT-5.1
 * Defines the expected attack plan structure
 */
const FocusAreaSchema = z.object({
  area: z.string().describe('Category name (e.g., Technical Depth, Product Sense, Leadership)'),
  topic: z.string().describe('Specific resume item being examined'),
  context: z.string().describe('Internal note for the AI: Why are we asking this?'),
  angle: z.string().describe('The specific doubt or skepticism to explore'),
  probing_questions: z.array(z.string()).describe('Direct, conversational questions ready for voice AI'),
});

const AttackPlanSchema = z.object({
  candidate_name: z.string().describe('Extracted candidate name from resume'),
  role_title: z.string().describe('Target role title'),
  difficulty_progression: z.enum(['gentle', 'moderate', 'aggressive']).describe('Interview difficulty approach'),
  overall_strategy: z.string().describe('1-2 sentences describing the interviewer persona to adopt'),
  focus_areas: z.array(FocusAreaSchema).min(3).max(5).describe('3-5 distinct focus areas for the interview'),
  behavioral_themes: z.array(z.string()).describe('Key behavioral themes to explore'),
});

/**
 * Generate an attack plan for the interview
 *
 * Uses OpenAI's GPT-5.1 with medium reasoning effort to analyze the candidate's
 * resume against job requirements and generate a strategic interview plan.
 * Uses structured outputs to ensure reliable JSON schema conformance.
 *
 * The generated plan includes:
 * - Difficulty level based on role seniority
 * - 3-5 focus areas identifying vague claims, impressive metrics, and critical skills
 * - Specific probing questions for each focus area
 *
 * @param input - Resume, job description, and interview parameters
 * @param env - Environment variables (requires OPENAI_API_KEY)
 * @returns Attack plan with focus areas and probing questions
 */
export async function generateAttackPlan(
  input: AttackPlanInput,
  env: Env
): Promise<AttackPlan> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for attack plan generation');
  }

  // Construct the prompt for the LLM
  const prompt = buildAttackPlanPrompt(input);

  // Call OpenAI API
  const attackPlanJson = await callOpenAIAPI(prompt, env.OPENAI_API_KEY);

  // Parse and validate the response
  const attackPlan = parseAndValidateAttackPlan(attackPlanJson);

  return attackPlan;
}

/**
 * Format parsed resume into a structured string for the LLM
 */
function formatParsedResume(resume: ParsedResume): string {
  let formatted = '';

  // Candidate Info
  if (resume.candidate_name) {
    formatted += `CANDIDATE: ${resume.candidate_name}\n`;
  }
  if (resume.email) {
    formatted += `EMAIL: ${resume.email}\n`;
  }
  if (resume.phone) {
    formatted += `PHONE: ${resume.phone}\n`;
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    formatted += `\nSKILLS:\n${resume.skills.map(s => `  • ${s}`).join('\n')}\n`;
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    formatted += `\nEXPERIENCE:\n`;
    resume.experience.forEach((exp, idx) => {
      formatted += `  ${idx + 1}. ${exp.title} at ${exp.company}`;
      if (exp.duration) formatted += ` (${exp.duration})`;
      formatted += '\n';
      if (exp.description) {
        formatted += `     ${exp.description}\n`;
      }
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    formatted += `\nEDUCATION:\n`;
    resume.education.forEach((edu, idx) => {
      formatted += `  ${idx + 1}. ${edu.institution}`;
      if (edu.degree) formatted += ` - ${edu.degree}`;
      if (edu.year) formatted += ` (${edu.year})`;
      formatted += '\n';
    });
  }

  return formatted;
}

/**
 * Build the prompt for the LLM to generate an attack plan
 */
function buildAttackPlanPrompt(input: AttackPlanInput): string {
  const { resume, jobDescription, roleTitle, companyName } = input;

  // Format the parsed resume for better LLM context
  const formattedResume = formatParsedResume(resume);

  return `You are the "Director of Interview Strategy," a ruthlessly efficient Technical Recruiter and Behavioral Psychologist.

Your goal is to analyze a candidate's Resume against a Job Description and generate a structured "Attack Plan" that a Voice AI Agent will use to interview the candidate.

INPUT DATA:
- Role Title: ${roleTitle}
- Company: ${companyName || 'Not specified'} ${companyName ? `(Infer culture: e.g., Microsoft=Scale, Startup=Speed)` : ''}

STRUCTURED RESUME DATA:
${formattedResume}

JOB DESCRIPTION:
${jobDescription}

OBJECTIVES:
1.  **Find the Gaps:** Identify where the resume fails to meet the JD requirements (e.g., "Resume lists Python but JD requires Java").
2.  **Detect the Fluff:** Locate vague metrics (e.g., "Increased productivity") or buzzword stuffing without substance.
3.  **Test the Logic:** Find projects that seem technically sound but business-foolish (e.g., "Built a custom framework for a simple landing page").
4.  **Cultural Fit:** Identify if the candidate's background (e.g., Freelance/Solo) conflicts with the role (e.g., Enterprise Teamwork).

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.

JSON STRUCTURE:
{
  "candidate_name": "Extracted Name",
  "role_title": "Target Role",
  "difficulty_progression": "gradual" | "aggressive",
  "overall_strategy": "1-2 sentences describing the persona the interviewer should adopt (e.g., 'Skeptical Senior Engineer' or 'Value-focused Product Lead').",
  "focus_areas": [
    {
      "area": "Category Name (e.g., Technical Depth, Product Sense, Leadership)",
      "topic": "Specific Resume Item (e.g., The 'Mango' Project)",
      "context": "Internal note for the AI: Why are we asking this? (e.g., 'Candidate claims 60k streams but lists it as a solo project, verify role.')",
      "angle": "The specific doubt or skepticism to explore (e.g., 'Did they actually lead this, or just contribute?')",
      "probing_questions": [
        "A direct, conversational opening question about this topic.",
        "A follow-up question that pushes for specific metrics or technical details.",
        "A 'trap' question to test honesty or depth."
      ]
    }
    // Generate 3-4 distinct Focus Areas
  ],
  "behavioral_themes": ["Theme 1", "Theme 2"]
}

RULES FOR CONTENT:
1.  **No Generic Questions:** Do not ask "Tell me about a time you failed." Instead, ask "You mentioned Project X failed to scale. Walk me through the specific week you realized the architecture was wrong."
2.  **Be Specific:** Quote the resume back to them. "You claim 94% GPA..." or "You used SvelteKit for..."
3.  **Trap the Resume Padding:** If they list a skill like "Kubernetes" but show no projects using it, create a Focus Area to test that specific skill depth.
4.  **Probing Questions:** These must be written in spoken English, ready for the Voice Agent to read aloud. Keep them under 20 words each where possible.

Example of a Good Focus Area (for a PM role):
{
  "area": "Prioritization",
  "topic": "NISTtech Coding Competition",
  "context": "Candidate built a custom platform for only 14 users.",
  "angle": "This suggests a lack of 'Build vs Buy' judgment.",
  "probing_questions": [
    "I see you built a bespoke grading platform for just 14 students. Why didn't you just use HackerRank?",
    "If the user base grew to 10,000 overnight, which part of your current architecture falls over first?"
  ]
}`;
}

/**
 * Call OpenAI's GPT-4 API
 */
async function callOpenAIAPI(prompt: string, apiKey: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  // Construct the prompt for the LLM
  const prompt = buildAttackPlanPrompt(input);

  // Call OpenAI API with structured outputs
  const response = await openai.responses.parse({
    model: 'gpt-5.1',
    reasoning_effort: 'medium',
    input: [
      {
        role: 'system',
        content: 'You are the "Director of Interview Strategy," a ruthlessly efficient Technical Recruiter and Behavioral Psychologist. Generate a structured attack plan that will be used by a Voice AI Agent to interview candidates.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    text: {
      format: zodTextFormat(AttackPlanSchema, 'attack_plan'),
    },
  });

  // Extract the parsed attack plan
  const parsedPlan = response.output_parsed;

  if (!parsedPlan) {
    throw new Error('OpenAI returned empty response');
  }

  // Map to database AttackPlan structure
  const difficulty: 'gentle' | 'moderate' | 'aggressive' = parsedPlan.difficulty_progression;

  const focus_areas = parsedPlan.focus_areas.map((area) => ({
    // Combine area and topic for a richer topic name
    topic: `${area.area}: ${area.topic}`,
    // Combine context and angle for comprehensive interviewer guidance
    context: `${area.context} ${area.angle}`,
    probing_questions: area.probing_questions,
  }));

  return {
    difficulty,
    focus_areas,
  };
}

/**
 * Build the prompt for the LLM to generate an attack plan
 * Simplified for structured outputs - schema enforcement handles the structure
 */
function buildAttackPlanPrompt(input: AttackPlanInput): string {
  const { resume, jobDescription, roleTitle, companyName } = input;

  return `Analyze this candidate's resume against the job description and generate a strategic "Attack Plan" for a Voice AI Agent to use during the interview.

INPUT DATA:
- Role Title: ${roleTitle}
- Company: ${companyName || 'Not specified'} ${companyName ? `(Infer culture: e.g., Microsoft=Scale, Startup=Speed)` : ''}
- Resume Text: ${resume.raw_text}
- Job Description: ${jobDescription}

ANALYSIS OBJECTIVES:
1.  **Find the Gaps:** Identify where the resume fails to meet JD requirements (e.g., "Resume lists Python but JD requires Java").
2.  **Detect the Fluff:** Locate vague metrics (e.g., "Increased productivity") or buzzword stuffing without substance.
3.  **Test the Logic:** Find projects that seem technically sound but business-foolish (e.g., "Built a custom framework for a simple landing page").
4.  **Cultural Fit:** Identify if the candidate's background (e.g., Freelance/Solo) conflicts with the role (e.g., Enterprise Teamwork).

QUESTION GUIDELINES:
1.  **No Generic Questions:** Don't ask "Tell me about a time you failed." Instead: "You mentioned Project X failed to scale. Walk me through the specific week you realized the architecture was wrong."
2.  **Be Specific:** Quote the resume back to them. "You claim 94% GPA..." or "You used SvelteKit for..."
3.  **Trap Resume Padding:** If they list a skill like "Kubernetes" but show no projects using it, create a Focus Area to test that specific skill depth.
4.  **Voice-Ready Questions:** Write in spoken English, ready for the Voice Agent to read aloud. Keep questions under 20 words where possible.
5.  **Generate 3-5 Focus Areas:** Each should target a different aspect of their experience or claims.

Example Focus Area (for a PM role):
- Area: "Prioritization"
- Topic: "NISTtech Coding Competition"
- Context: "Candidate built a custom platform for only 14 users."
- Angle: "This suggests a lack of 'Build vs Buy' judgment."
- Questions:
  * "I see you built a bespoke grading platform for just 14 students. Why didn't you just use HackerRank?"
  * "If the user base grew to 10,000 overnight, which part of your current architecture falls over first?"`;
}

