/**
 * Resume parsing service
 * Extracts structured information from resume files
 */

import { Env } from '../types/env';
import { ParsedResume } from '../types/database';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

/**
 * Zod schema for structured output from gpt-5-nano
 * Defines the expected parsed resume structure
 */
const ExperienceSchema = z.object({
  company: z.string().describe('Company name'),
  title: z.string().describe('Job title'),
  duration: z.string().optional().describe('Duration of employment'),
  description: z.string().optional().describe('Job description or responsibilities'),
});

const EducationSchema = z.object({
  institution: z.string().describe('Educational institution name'),
  degree: z.string().optional().describe('Degree or qualification'),
  year: z.string().optional().describe('Graduation year or time period'),
});

const ParsedResumeSchema = z.object({
  candidate_name: z.string().optional().describe('Full name of the candidate'),
  email: z.string().optional().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  skills: z.array(z.string()).optional().describe('List of technical and soft skills'),
  experience: z.array(ExperienceSchema).optional().describe('Work experience history'),
  education: z.array(EducationSchema).optional().describe('Educational background'),
});

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
 * Uses gpt-5-nano for fast, cost-effective parsing with structured outputs
 */
async function extractWithOpenAI(text: string, apiKey: string): Promise<ParsedResume> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const userPrompt = `Parse the following resume and extract structured information including name, contact details, skills, work experience, and education.

Resume text:
${text}

Extract all relevant information accurately.`;

  // Call OpenAI API with structured outputs (gpt-5-nano for efficient parsing)
  const response = await openai.responses.parse({
    model: 'gpt-5-nano',
    input: [
      {
        role: 'system',
        content: 'You are a resume parser. Extract structured information from resumes accurately.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    text: {
      format: zodTextFormat(ParsedResumeSchema, 'parsed_resume'),
    },
  });

  const parsedData = response.output_parsed;

  if (!parsedData) {
    throw new Error('OpenAI returned empty response');
  }

  return {
    raw_text: text,
    candidate_name: parsedData.candidate_name,
    email: parsedData.email,
    phone: parsedData.phone,
    skills: parsedData.skills,
    experience: parsedData.experience,
    education: parsedData.education,
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
