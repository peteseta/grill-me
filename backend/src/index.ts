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

        res.json({
            session_id: sessionId,
            attack_plan: attackPlan
        });

    } catch (error: any) {
        console.error("Error in /api/sessions/create:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
