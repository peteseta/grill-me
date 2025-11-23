/**
 * Supabase client utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../types/env';
import { User, InterviewSession, InterviewAnalysis } from '../types/database';

/**
 * Database schema type for Supabase client
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Omit<InterviewSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<InterviewSession, 'id' | 'created_at'>>;
      };
      interview_analyses: {
        Row: InterviewAnalysis;
        Insert: Omit<InterviewAnalysis, 'id' | 'created_at'>;
        Update: Partial<Omit<InterviewAnalysis, 'id' | 'created_at'>>;
      };
    };
  };
}

/**
 * Initialize Supabase client with service role key for server-side operations
 */
export function getSupabaseClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Initialize Supabase client with anon key for client-facing operations
 */
export function getSupabaseAnonClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
