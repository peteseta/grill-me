/**
 * Interview analysis routes
 * POST /api/v1/sessions/{session_id}/analyze
 * GET /api/v1/sessions/{session_id}/results
 */

import { Context } from 'hono';
import { Env } from '../types/env';
import { AnalyzeSessionRequest, AnalyzeSessionResponse } from '../types/api';
import { InterviewSession, InterviewAnalysis } from '../types/database';
import { getSupabaseClient } from '../utils/supabase';
import { fetchTranscript, fetchAudioUrl } from '../services/elevenlabs';
import { analyzeInterview } from '../services/interview-analyzer';
import { success, badRequest, notFound } from '../utils/response';

/**
 * POST /api/v1/sessions/{session_id}/analyze
 * Analyze the interview and generate feedback
 */
export async function analyzeSession(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Get session_id from URL params
    const sessionId = c.req.param('session_id');

    // Parse request body
    const body = await c.req.json<AnalyzeSessionRequest>();
    if (!body.conversation_id) {
      return badRequest('Missing conversation_id');
    }

    // Fetch session from database
    const supabase = getSupabaseClient(c.env);
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single<InterviewSession>();

    if (sessionError || !session) {
      return notFound('Session not found');
    }

    // Fetch transcript from ElevenLabs
    const transcript = await fetchTranscript(body.conversation_id, c.env);

    // Fetch audio URL from ElevenLabs (can just fetch from the supabase???)
    const audioUrl = await fetchAudioUrl(body.conversation_id, c.env);

    // Analyze interview
    const analysis = await analyzeInterview({
      transcript,
      jobDescription: session.job_description || '',
      roleTitle: session.role_title,
      interviewType: session.interview_type,
    }, c.env);

    // Store analysis in database
    const { data: analysisData, error: analysisError } = await (supabase as any)
      .from('interview_analyses')
      .insert({
        session_id: sessionId,
        full_transcript_json: transcript,
        audio_url: audioUrl,
        feedback_summary: analysis.summary_feedback,
        structured_feedback: analysis.structured_feedback,
        score_bullshit: analysis.score_bullshit,
        score_overall: analysis.score_overall,
        score_technical: analysis.score_technical,
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // Update session status to 'completed'
    await (supabase as any)
      .from('interview_sessions')
      .update({
        status: 'completed',
        elevenlabs_conversation_id: body.conversation_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Return analysis response
    const response: AnalyzeSessionResponse = {
      session_id: sessionId,
      metrics: {
        score_overall: analysis.score_overall,
        score_bullshit: analysis.score_bullshit,
        score_technical: analysis.score_technical,
      },
      summary_feedback: analysis.summary_feedback,
      full_transcript_json: transcript,
      structured_feedback: analysis.structured_feedback,
    };

    return success(response);
  } catch (error) {
    console.error('Error analyzing interview:', error);
    return badRequest('Failed to analyze interview');
  }
}

/**
 * GET /api/v1/sessions/{session_id}/results
 * Get cached analysis results for a session
 */
export async function getSessionResults(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Get session_id from URL params
    const sessionId = c.req.param('session_id');

    // Query analysis from database
    const supabase = getSupabaseClient(c.env);
    const { data: analysis, error } = await supabase
      .from('interview_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .single<InterviewAnalysis>();

    if (error || !analysis) {
      return notFound('Analysis not found for this session');
    }

    // Build response
    const response: AnalyzeSessionResponse = {
      session_id: sessionId,
      metrics: {
        score_overall: analysis.score_overall || 0,
        score_bullshit: analysis.score_bullshit || 0,
        score_technical: analysis.score_technical || 0,
      },
      summary_feedback: analysis.feedback_summary || '',
      full_transcript_json: analysis.full_transcript_json || [],
      structured_feedback: analysis.structured_feedback || [],
    };

    return success(response);
  } catch (error) {
    console.error('Error retrieving results:', error);
    return badRequest('Failed to retrieve results');
  }
}
