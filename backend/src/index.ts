import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { findResourcesForTopic, LearningResource } from './learningResources';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- In-Memory Storage (Replace with Database in Production) ---
interface Session {
    id: string;
    role_title: string;
    job_description: string;
    resume_text: string;
    attack_plan: any;
    transcript: TranscriptMessage[];
    status: 'setup' | 'in_progress' | 'paused' | 'completed';
    created_at: number;
    completed_at?: number;
    feedback?: any;
}

interface TranscriptMessage {
    id: string;
    speaker: 'interviewer' | 'candidate';
    content: string;
    timestamp: number;
}

const sessions = new Map<string, Session>();

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

// --- Helper Functions ---

async function parseResume(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: buffer });
        return result.value;
    } else {
        // Assume text
        return buffer.toString('utf-8');
    }
}

async function parseJobDescription(jdInput: string): Promise<string> {
    // Strictly check if the entire input is a URL
    const urlRegex = /^http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+$/;
    const trimmedInput = jdInput.trim();

    if (urlRegex.test(trimmedInput)) {
        try {
            // Fetch URL content (Using fetch API available in Node 18+)
            // Note: Basic SSRF protection is minimal here. In production, ensure to validate/allowlist domains or use a proxy.
            const response = await fetch(trimmedInput);
            const html = await response.text();
            const $ = cheerio.load(html);

            // Remove scripts and styles
            $('script').remove();
            $('style').remove();
            $('nav').remove();
            $('header').remove();
            $('footer').remove();

            return $('body').text().replace(/\s+/g, ' ').trim();
        } catch (error) {
            console.error("Error scraping URL:", error);
            return `Error scraping URL: ${jdInput}.`;
        }
    } else {
        return jdInput;
    }
}

// --- Attack Plan Generation ---

async function generateAttackPlan(resumeText: string, jdText: string, roleTitle: string, companyName: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API Key not found");
    }

    const systemPrompt = `
You are the "Director of Interview Strategy," a ruthlessly efficient Technical Recruiter and Behavioral Psychologist.

Your goal is to analyze a candidate's Resume against a Job Description and generate a structured "Attack Plan" that a Voice AI Agent will use to interview the candidate.

OBJECTIVES:
1.  **Find the Gaps:** Identify where the resume fails to meet the JD requirements (e.g., "Resume lists Python but JD requires Java").
2.  **Detect the Fluff:** Locate vague metrics (e.g., "Increased productivity") or buzzword stuffing without substance.
3.  **Test the Logic:** Find projects that seem technically sound but business-foolish (e.g., "Built a custom framework for a simple landing page").
4.  **Cultural Fit:** Identify if the candidate's background (e.g., Freelance/Solo) conflicts with the role (e.g., Enterprise Teamwork).

RULES FOR CONTENT:
1.  **No Generic Questions:** Do not ask "Tell me about a time you failed." Instead, ask "You mentioned Project X failed to scale. Walk me through the specific week you realized the architecture was wrong."
2.  **Be Specific:** Quote the resume back to them. "You claim 94% GPA..." or "You used SvelteKit for..."
3.  **Trap the Resume Padding:** If they list a skill like "Kubernetes" but show no projects using it, create a Focus Area to test that specific skill depth.
4.  **Probing Questions:** These must be written in spoken English, ready for the Voice Agent to read aloud. Keep them under 20 words each where possible.
`;

    const userPrompt = `
INPUT DATA:
- Role Title: ${roleTitle}
- Company: ${companyName} (Infer culture: e.g., Microsoft=Scale, Startup=Speed)
- Resume Text: ${resumeText.substring(0, 15000)}
- Job Description: ${jdText.substring(0, 10000)}
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "attack_plan",
                    schema: {
                        type: "object",
                        properties: {
                            candidate_name: { type: "string", description: "Extracted Name" },
                            role_title: { type: "string", description: "Target Role" },
                            difficulty_progression: { type: "string", enum: ["gradual", "aggressive"] },
                            overall_strategy: { type: "string", description: "1-2 sentences describing the persona the interviewer should adopt." },
                            focus_areas: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        area: { type: "string", description: "Category Name (e.g., Technical Depth, Product Sense, Leadership)" },
                                        topic: { type: "string", description: "Specific Resume Item (e.g., The 'Mango' Project)" },
                                        context: { type: "string", description: "Internal note for the AI: Why are we asking this?" },
                                        angle: { type: "string", description: "The specific doubt or skepticism to explore" },
                                        probing_questions: {
                                            type: "array",
                                            items: { type: "string" },
                                            description: "3-4 distinct questions. Direct, conversational, follow-up, trap."
                                        }
                                    },
                                    required: ["area", "topic", "context", "angle", "probing_questions"],
                                    additionalProperties: false
                                }
                            },
                            behavioral_themes: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: ["candidate_name", "role_title", "difficulty_progression", "overall_strategy", "focus_areas", "behavioral_themes"],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        });

        const content = completion.choices[0].message.content;
        if (content) {
            return JSON.parse(content);
        } else {
            throw new Error("Empty response from OpenAI");
        }
    } catch (error) {
        console.error("OpenAI Error:", error);
        throw error;
    }
}

// --- Routes ---

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.post('/api/sessions/create', upload.single('resume_file'), async (req: Request, res: Response) => {
    try {
        const resumeFile = req.file;
        const jobDescription = req.body.job_description;
        const roleTitle = req.body.role_title;
        const companyName = req.body.company_name || "Unknown Company";
        // const interviewType = req.body.interview_type;

        if (!resumeFile) {
             res.status(400).json({ error: 'Resume file is required' });
             return;
        }
        if (!jobDescription) {
             res.status(400).json({ error: 'Job description is required' });
             return;
        }

        // 1. Parse Resume
        console.log(`Parsing resume: ${resumeFile.originalname} (${resumeFile.mimetype})`);
        const resumeText = await parseResume(resumeFile.buffer, resumeFile.mimetype);

        // 2. Parse JD
        const jdText = await parseJobDescription(jobDescription);

        // 3. Generate Attack Plan
        const attackPlan = await generateAttackPlan(resumeText, jdText, roleTitle, companyName);

        // 4. Generate Session ID
        const sessionId = crypto.randomUUID();

        // 5. Store Session
        const session: Session = {
            id: sessionId,
            role_title: roleTitle,
            job_description: jdText,
            resume_text: resumeText,
            attack_plan: attackPlan,
            transcript: [],
            status: 'setup',
            created_at: Date.now()
        };
        sessions.set(sessionId, session);

        console.log(`Session created: ${sessionId}`);

        res.json({
            session_id: sessionId,
            attack_plan: attackPlan
        });

    } catch (error: any) {
        console.error("Error in /api/sessions/create:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// Get session details
app.get('/api/sessions/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    // Return session without attack plan (attack plan should be hidden from frontend)
    res.json({
        id: session.id,
        role_title: session.role_title,
        status: session.status,
        created_at: session.created_at,
        completed_at: session.completed_at
    });
});

// Update session status
app.post('/api/sessions/:sessionId/status', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { status } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    session.status = status;
    if (status === 'completed') {
        session.completed_at = Date.now();
    }

    sessions.set(sessionId, session);
    res.json({ success: true, status: session.status });
});

// Add transcript message
app.post('/api/sessions/:sessionId/transcript', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { speaker, content } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    const message: TranscriptMessage = {
        id: crypto.randomUUID(),
        speaker: speaker,
        content: content,
        timestamp: Date.now()
    };

    session.transcript.push(message);
    sessions.set(sessionId, session);

    res.json({ success: true, message });
});

// Get transcript
app.get('/api/sessions/:sessionId/transcript', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    res.json({ transcript: session.transcript });
});

// Lifeline endpoint - Get AI advice
app.post('/api/sessions/:sessionId/lifeline', async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ error: 'OpenAI API Key not configured' });
        return;
    }

    try {
        // Get last 5 messages for context
        const recentMessages = session.transcript.slice(-5);
        const contextStr = recentMessages
            .map(m => `${m.speaker}: ${m.content}`)
            .join('\n');

        const lifelinePrompt = `You are helping a candidate in a mock interview. They've paused to ask for help.

Recent conversation:
${contextStr}

The role they're interviewing for: ${session.role_title}

Provide:
1. What the interviewer is really asking for (subtext)
2. A strong structure for answering (STAR method, etc.)
3. 2-3 specific points to mention
4. What to avoid saying

Be concise and actionable - they need to resume soon!

Respond in JSON format:
{
    "subtext": "string",
    "strategy": ["point1", "point2", "point3"],
    "avoid": ["thing1", "thing2"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an expert interview coach providing real-time strategic advice." },
                { role: "user", content: lifelinePrompt }
            ],
            response_format: { type: "json_object" }
        });

        const advice = completion.choices[0].message.content;
        const adviceJson = advice ? JSON.parse(advice) : {};

        res.json({
            advice: adviceJson,
            context: recentMessages
        });

    } catch (error: any) {
        console.error("Error in lifeline:", error);
        res.status(500).json({ error: error.message || 'Failed to generate advice' });
    }
});

// Analyze interview and generate feedback
app.post('/api/sessions/:sessionId/analyze', async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ error: 'OpenAI API Key not configured' });
        return;
    }

    try {
        const transcriptStr = session.transcript
            .map(m => `${m.speaker}: ${m.content}`)
            .join('\n\n');

        const analysisPrompt = `You are an expert interview analyst. Analyze this mock interview transcript and provide detailed feedback.

Role: ${session.role_title}

Transcript:
${transcriptStr}

Provide a comprehensive analysis in JSON format:
{
    "overall_score": <number 1-10>,
    "bullshit_meter": <number 0-100, higher means more BS detected>,
    "waffle_score": <number 0-100, higher means more rambling>,
    "summary": "string",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "detailed_feedback": {
        "technical": "string",
        "communication": "string",
        "behavioral": "string"
    }
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an expert technical interviewer providing comprehensive interview analysis." },
                { role: "user", content: analysisPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const feedback = completion.choices[0].message.content;
        const feedbackJson = feedback ? JSON.parse(feedback) : {};

        // Store feedback
        session.feedback = feedbackJson;
        session.status = 'completed';
        session.completed_at = Date.now();
        sessions.set(sessionId, session);

        res.json(feedbackJson);

    } catch (error: any) {
        console.error("Error in analyze:", error);
        res.status(500).json({ error: error.message || 'Failed to analyze interview' });
    }
});

// Get feedback
app.get('/api/sessions/:sessionId/feedback', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    if (!session.feedback) {
        res.status(404).json({ error: 'Feedback not yet generated. Call /analyze first.' });
        return;
    }

    res.json(session.feedback);
});

// Get learning recommendations based on feedback
app.get('/api/sessions/:sessionId/recommendations', async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    if (!session.feedback) {
        res.status(404).json({ error: 'Feedback not yet generated. Call /analyze first.' });
        return;
    }

    try {
        const feedback = session.feedback;
        const weaknesses = feedback.weaknesses || [];
        const detailedFeedback = feedback.detailed_feedback || {};

        // Extract topics from weaknesses and detailed feedback
        const allTopics: string[] = [...weaknesses];
        
        // Add topics from detailed feedback
        if (detailedFeedback.technical) {
            allTopics.push(detailedFeedback.technical);
        }
        if (detailedFeedback.communication) {
            allTopics.push(detailedFeedback.communication);
        }
        if (detailedFeedback.behavioral) {
            allTopics.push(detailedFeedback.behavioral);
        }

        // Use AI to extract topics and generate learning recommendations dynamically
        if (process.env.OPENAI_API_KEY && weaknesses.length > 0) {
            try {
                const recommendationPrompt = `You are an expert at recommending learning resources for interview preparation. Analyze the interview feedback and generate specific learning recommendations.

Interview Feedback:
Weaknesses: ${weaknesses.join(', ')}
Technical Feedback: ${detailedFeedback.technical || 'N/A'}
Communication Feedback: ${detailedFeedback.communication || 'N/A'}
Behavioral Feedback: ${detailedFeedback.behavioral || 'N/A'}

For each area that needs improvement, identify the specific topic and recommend 2-3 high-quality learning resources (YouTube videos, articles, courses, or documentation).

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "topic": "specific topic name (e.g., 'Heaps Data Structure', 'STAR Method', 'System Design')",
      "resources": [
        {
          "title": "Resource title",
          "url": "Full URL",
          "type": "youtube|article|course|documentation",
          "description": "Brief description of what this resource covers"
        }
      ]
    }
  ]
}

Focus on:
- Well-known, high-quality resources (NeetCode, freeCodeCamp, GeeksforGeeks, official docs, etc.)
- Specific topics mentioned in the weaknesses
- Mix of video and written resources
- Resources that are actually helpful for interview prep

Generate 3-5 topic recommendations with 2-3 resources each.`;

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { 
                            role: "system", 
                            content: "You are an expert at recommending learning resources for technical interview preparation. Always provide real, accessible URLs for well-known educational platforms." 
                        },
                        { role: "user", content: recommendationPrompt }
                    ],
                    response_format: { type: "json_object" }
                });

                const response = completion.choices[0].message.content;
                if (response) {
                    const parsed = JSON.parse(response);
                    const aiRecommendations = parsed.recommendations || [];
                    
                    if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
                        res.json({
                            recommendations: aiRecommendations,
                            generated_at: Date.now()
                        });
                        return;
                    }
                }
            } catch (aiError) {
                console.error("Error generating AI recommendations:", aiError);
                // Fall through to backup method
            }
        }

        // Fallback: Use keyword matching for basic topics
        const recommendations: { topic: string; resources: LearningResource[] }[] = [];
        const seenTopics = new Set<string>();

        for (const topic of allTopics) {
            const topicLower = topic.toLowerCase();
            if (seenTopics.has(topicLower)) continue;
            seenTopics.add(topicLower);

            const resources = findResourcesForTopic(topic);
            if (resources.length > 0) {
                recommendations.push({
                    topic: topic,
                    resources: resources
                });
            }
        }

        // If still no recommendations, provide general resources
        if (recommendations.length === 0) {
            recommendations.push({
                topic: 'General Interview Prep',
                resources: [
                    {
                        title: 'NeetCode YouTube Channel',
                        url: 'https://www.youtube.com/c/NeetCode',
                        type: 'youtube',
                        description: 'Data structures, algorithms, and coding interview prep'
                    },
                    {
                        title: 'LeetCode - Practice Problems',
                        url: 'https://leetcode.com/',
                        type: 'article',
                        description: 'Practice coding interview problems'
                    },
                    {
                        title: 'System Design Primer',
                        url: 'https://github.com/donnemartin/system-design-primer',
                        type: 'article',
                        description: 'Comprehensive system design guide'
                    }
                ]
            });
        }

        res.json({
            recommendations: recommendations,
            generated_at: Date.now()
        });

    } catch (error: any) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
