-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.interview_analyses (
                                           id uuid NOT NULL DEFAULT gen_random_uuid(),
                                           session_id uuid NOT NULL UNIQUE,
                                           full_transcript_json jsonb,
                                           audio_url text,
                                           feedback_summary text,
                                           structured_feedback jsonb,
                                           created_at timestamp with time zone DEFAULT now(),
                                           score_bullshit smallint,
                                           score_overall smallint,
                                           score_technical smallint,
                                           CONSTRAINT interview_analyses_pkey PRIMARY KEY (id),
                                           CONSTRAINT interview_analyses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.interview_sessions(id)
);
CREATE TABLE public.interview_sessions (
                                           id uuid NOT NULL DEFAULT gen_random_uuid(),
                                           user_id uuid NOT NULL,
                                           role_title text NOT NULL,
                                           company_name text,
                                           job_description text,
                                           interview_type text DEFAULT 'mixed'::text,
                                           attack_plan jsonb,
                                           status text DEFAULT 'setup'::text,
                                           elevenlabs_conversation_id text,
                                           created_at timestamp with time zone DEFAULT now(),
                                           updated_at timestamp with time zone DEFAULT now(),
                                           resume_text text,
                                           CONSTRAINT interview_sessions_pkey PRIMARY KEY (id),
                                           CONSTRAINT interview_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
                              id uuid NOT NULL DEFAULT gen_random_uuid(),
                              email text NOT NULL UNIQUE,
                              created_at timestamp with time zone DEFAULT now(),
                              CONSTRAINT users_pkey PRIMARY KEY (id)
);