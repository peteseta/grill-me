/**
 * Session management routes
 * POST /api/v1/sessions - Create new session
 * GET /api/v1/sessions - List user's sessions
 */

import { Context } from 'hono';
import { Env } from '../types/env';
import { CreateSessionResponse, SessionListResponse } from '../types/api';
import { getSupabaseClient } from '../utils/supabase';
import { parseResume } from '../services/resume-parser';
import { generateAttackPlan } from '../services/attack-plan-generator';
import { success, created, badRequest, notFound } from '../utils/response';

/**
 * POST /api/v1/sessions
 * Create a new interview session
 *
 * TODO: Implement session creation
 * - Parse multipart/form-data to extract resume file, job_description_text, user_id, interview_type
 * - Validate required fields
 * - Parse resume using resume-parser service
 * - Generate attack plan using attack-plan-generator service
 * - Store session in database with status 'ready'
 * - Return session_id and status
 */
export async function createSession(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // TODO: Parse multipart form data
    // const formData = await c.req.formData();
    // const resume = formData.get('resume') as File;
    // const jobDescription = formData.get('job_description_text') as string;
    // const userId = formData.get('user_id') as string;
    // const interviewType = formData.get('interview_type') as string;
    // const roleTitle = formData.get('role_title') as string;
    // const companyName = formData.get('company_name') as string;

    // TODO: Validate inputs
    // if (!resume || !jobDescription || !userId || !interviewType) {
    //   return badRequest('Missing required fields');
    // }

    // TODO: Parse resume
    // const parsedResume = await parseResume(resume, c.env);

    // TODO: Generate attack plan
    // const attackPlan = await generateAttackPlan({
    //   resume: parsedResume,
    //   jobDescription,
    //   roleTitle,
    //   companyName,
    //   interviewType: interviewType as any,
    // }, c.env);

    // TODO: Create session in database
    // const supabase = getSupabaseClient(c.env);
    // const { data, error } = await supabase
    //   .from('interview_sessions')
    //   .insert({
    //     user_id: userId,
    //     role_title: roleTitle,
    //     company_name: companyName,
    //     job_description: jobDescription,
    //     interview_type: interviewType as any,
    //     attack_plan: attackPlan,
    //     status: 'ready',
    //     resume_text: parsedResume.raw_text,
    //   })
    //   .select()
    //   .single();

    // if (error) throw error;

    // TODO: Return response
    // const response: CreateSessionResponse = {
    //   session_id: data.id,
    //   status: 'ready',
    // };
    // return created(response);

    return badRequest('Session creation not yet implemented');
  } catch (error) {
    console.error('Error creating session:', error);
    return badRequest('Failed to create session');
  }
}

/**
 * GET /api/v1/sessions?user_id={uuid}
 * List all sessions for a user
 *
 * TODO: Implement session listing
 * - Extract user_id from query parameters
 * - Validate user_id is a valid UUID
 * - Query database for all sessions for this user
 * - Join with interview_analyses to get scores if available
 * - Return array of sessions with basic info and scores
 */
export async function listSessions(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // TODO: Get user_id from query params
    // const userId = c.req.query('user_id');
    // if (!userId) {
    //   return badRequest('Missing user_id query parameter');
    // }

    // TODO: Query sessions from database
    // const supabase = getSupabaseClient(c.env);
    // const { data: sessions, error } = await supabase
    //   .from('interview_sessions')
    //   .select(`
    //     id,
    //     created_at,
    //     role_title,
    //     company_name,
    //     status,
    //     interview_analyses (
    //       score_overall,
    //       score_bullshit
    //     )
    //   `)
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false });

    // if (error) throw error;

    // TODO: Transform to API response format
    // const response: SessionListResponse = sessions.map(session => ({
    //   session_id: session.id,
    //   created_at: session.created_at,
    //   role_title: session.role_title,
    //   company_name: session.company_name,
    //   status: session.status,
    //   scores: session.interview_analyses?.[0] ? {
    //     score_overall: session.interview_analyses[0].score_overall,
    //     score_bullshit: session.interview_analyses[0].score_bullshit,
    //   } : null,
    // }));

    // return success(response);

    return badRequest('Session listing not yet implemented');
  } catch (error) {
    console.error('Error listing sessions:', error);
    return badRequest('Failed to list sessions');
  }
}
