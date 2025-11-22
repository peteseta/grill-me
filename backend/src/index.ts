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
// In a real app, ensure process.env.OPENAI_API_KEY is set
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock-key",
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

async function generateAttackPlan(resumeText: string, jdText: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API Key not found");
    }

    const systemPrompt = `
    You are an expert technical interviewer. Your goal is to create a "Attack Plan" for an upcoming interview.
    You will be given a candidate's resume and a job description.

    Analyze them to identify:
    1. Weak points or gaps in the resume compared to the JD.
    2. Areas where the candidate claims expertise but lacks evidence (the "angle").
    3. Key technical topics to probe depth.
    4. Behavioral themes relevant to the role.

    Output the plan in valid JSON format matching the following structure:
    {
        "focus_areas": [
            {
                "area": "string",
                "angle": "string",
                "probing_questions": ["string"]
            }
        ],
        "technical_depth": ["string"],
        "behavioral_themes": ["string"],
        "difficulty_progression": "gradual" | "aggressive"
    }
    `;

    const userPrompt = `
    Resume Content:
    ${resumeText.substring(0, 10000)}

    Job Description:
    ${jdText.substring(0, 5000)}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
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
        const attackPlan = await generateAttackPlan(resumeText, jdText);

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

// Start server
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
