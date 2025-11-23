/**
 * Resume parsing service
 * Extracts structured information from resume files
 */

import { Env } from '../types/env';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export interface ParsedResume {
  raw_text: string;
  candidate_name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: {
    company: string;
    title: string;
    duration?: string;
    description?: string;
  }[];
  education?: {
    institution: string;
    degree?: string;
    year?: string;
  }[];
}

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

/**
 * Extract text from a DOCX file
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Extract text from a TXT file
 */
async function extractTextFromTXT(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from resume file based on type
 */
async function extractText(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Determine file type from MIME type or extension
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDOCX(file);
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await extractTextFromTXT(file);
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, TXT`);
  }
}

/**
 * Call OpenAI API to extract structured data from resume text
 */
async function extractWithOpenAI(text: string, apiKey: string): Promise<ParsedResume> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a resume parser. Extract structured information from resumes and return valid JSON only.',
        },
        {
          role: 'user',
          content: `Parse the following resume and extract structured information. Return ONLY a valid JSON object with this exact structure:
{
  "candidate_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "skills": ["array of skill strings"] or null,
  "experience": [{"company": "string", "title": "string", "duration": "string or null", "description": "string or null"}] or null,
  "education": [{"institution": "string", "degree": "string or null", "year": "string or null"}] or null
}

Resume text:
${text}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);

  return {
    raw_text: text,
    candidate_name: parsed.candidate_name || undefined,
    email: parsed.email || undefined,
    phone: parsed.phone || undefined,
    skills: parsed.skills || undefined,
    experience: parsed.experience || undefined,
    education: parsed.education || undefined,
  };
}

/**
 * Parse a resume file and extract structured information
 *
 * @param resumeFile - The resume file (PDF, DOCX, or TXT)
 * @param env - Environment variables for API keys
 * @returns Parsed resume data
 */
export async function parseResume(
  resumeFile: File,
  env: Env
): Promise<ParsedResume> {
  // Step 1: Extract text from file
  const text = await extractText(resumeFile);

  if (!text || text.trim().length === 0) {
    throw new Error('Failed to extract text from resume file');
  }

  // Step 2: Use OpenAI to extract structured data
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for resume parsing');
  }

  return await extractWithOpenAI(text, env.OPENAI_API_KEY);
}
