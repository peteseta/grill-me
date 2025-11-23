/**
 * Session management routes
 * POST /api/v1/sessions - Create new session
 * GET /api/v1/sessions - List user's sessions
 */

import { Context } from 'hono';
import { Env } from '@/types';
import { CreateSessionResponse, SessionListResponse } from '@/types';
import { getSupabaseClient, Database } from '@/utils';
import { parseResume } from '@/services';
import { generateAttackPlan } from '@/services';
import { success, created, badRequest } from '@/utils';

/**
 * POST /api/v1/sessions
 * Create a new interview session
 */
export async function createSession(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Parse multipart form data
    const formData = await c.req.formData();
    const resumeEntry = formData.get('resume');
    const jobDescription = formData.get('job_description_text') as string;
    const userId = formData.get('user_id') as string;
    const interviewType = formData.get('interview_type') as string;
    const roleTitle = formData.get('role_title') as string;
    const companyName = formData.get('company_name') as string;

    // Validate inputs
    if (!resumeEntry || !jobDescription || !userId || !interviewType) {
      return badRequest('Missing required fields: resume, job_description_text, user_id, and interview_type are required');
    }

    // Validate resume is a File (check if it has file-like properties)
    if (typeof resumeEntry === 'string') {
      return badRequest('resume must be a file, not a string');
    }

    const resume = resumeEntry as File;

    // Validate interview_type
    if (!['Technical', 'Behavioral', 'Mixed'].includes(interviewType)) {
      return badRequest('interview_type must be one of: Technical, Behavioral, Mixed');
    }

    // Parse resume
    const parsedResume = await parseResume(resume, c.env);

    // Generate attack plan
    const attackPlan = await generateAttackPlan({
      resume: parsedResume,
      jobDescription,
      roleTitle: roleTitle || 'Candidate',
      companyName,
      interviewType: interviewType as 'Technical' | 'Behavioral' | 'Mixed',
    }, c.env);

    // Create session in database
    const supabase = getSupabaseClient(c.env);

    const sessionData: Database['public']['Tables']['interview_sessions']['Insert'] = {
      user_id: userId,
      role_title: roleTitle || 'Candidate',
      company_name: companyName,
      job_description: jobDescription,
      interview_type: interviewType as 'Technical' | 'Behavioral' | 'Mixed',
      attack_plan: attackPlan,
      status: 'ready',
      parsed_resume: parsedResume,
    };

    const result: any = await supabase
      .from('interview_sessions')
      .insert(sessionData as any)
      .select()
      .single();

    if (result.error) throw result.error;
    if (!result.data) throw new Error('No data returned from insert');

    // Return response
    const response: CreateSessionResponse = {
      session_id: result.data.id,
      status: 'ready',
    };
    return created(response);
  } catch (error) {
    console.error('Error creating session:', error);
    return badRequest(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * GET /api/v1/sessions?user_id={uuid}
 * List all sessions for a user
 */
export async function listSessions(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Get user_id from query params
    const userId = c.req.query('user_id');
    if (!userId) {
      return badRequest('Missing user_id query parameter');
    }

    // Query sessions from database
    const supabase = getSupabaseClient(c.env);
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        created_at,
        role_title,
        company_name,
        status,
        interview_analyses (
          score_overall,
          score_bullshit
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to API response format
    const response: SessionListResponse = sessions.map((session: any) => ({
      session_id: session.id,
      created_at: session.created_at,
      role_title: session.role_title,
      company_name: session.company_name,
      status: session.status,
      scores: session.interview_analyses?.[0] ? {
        score_overall: session.interview_analyses[0].score_overall,
        score_bullshit: session.interview_analyses[0].score_bullshit,
      } : null,
    }));

    return success(response);
  } catch (error) {
    console.error('Error listing sessions:', error);
    return badRequest(`Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
