/**
 * Attack plan generation service
 * Uses LLM to generate interview strategy based on resume and job description
 */

import OpenAI from 'openai';
import { Env } from '../types/env';
import { AttackPlan, ParsedResume } from '../types/database';

export interface AttackPlanInput {
  resume: ParsedResume;
  jobDescription: string;
  roleTitle: string;
  companyName?: string;
  interviewType: 'Technical' | 'Behavioral' | 'Mixed';
}

/**
 * Generate an attack plan for the interview
 *
 * Uses OpenAI's GPT-4 to analyze the candidate's resume against job requirements
 * and generate a strategic interview plan.
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
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Return only valid JSON with no markdown formatting.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = completion.choices[0].message.content;

  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return content;
}

/**
 * Parse and validate the LLM response into an AttackPlan
 */
function parseAndValidateAttackPlan(jsonString: string): AttackPlan {
  // Remove markdown code blocks if present
  let cleaned = jsonString.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse attack plan JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate the rich structure from the prompt
  if (!parsed.difficulty_progression || !['gradual', 'aggressive'].includes(parsed.difficulty_progression)) {
    throw new Error('Invalid or missing difficulty_progression (must be "gradual" or "aggressive")');
  }

  if (!Array.isArray(parsed.focus_areas) || parsed.focus_areas.length === 0) {
    throw new Error('focus_areas must be a non-empty array');
  }

  // Validate each focus area has the expected fields
  for (const area of parsed.focus_areas) {
    if (!area.area || typeof area.area !== 'string') {
      throw new Error('Each focus area must have an "area" category string');
    }
    if (!area.topic || typeof area.topic !== 'string') {
      throw new Error('Each focus area must have a topic string');
    }
    if (!area.context || typeof area.context !== 'string') {
      throw new Error('Each focus area must have a context string');
    }
    if (!area.angle || typeof area.angle !== 'string') {
      throw new Error('Each focus area must have an angle string');
    }
    if (!Array.isArray(area.probing_questions) || area.probing_questions.length === 0) {
      throw new Error('Each focus area must have a non-empty probing_questions array');
    }
    for (const question of area.probing_questions) {
      if (typeof question !== 'string') {
        throw new Error('All probing questions must be strings');
      }
    }
  }

  // Map the rich LLM response to the database AttackPlan structure
  const difficulty: 'gentle' | 'moderate' | 'aggressive' =
    parsed.difficulty_progression === 'gradual' ? 'moderate' : 'aggressive';

  const focus_areas = parsed.focus_areas.map((area: any) => ({
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
