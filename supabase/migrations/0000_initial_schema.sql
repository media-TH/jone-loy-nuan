-- Base schema required before incremental migrations
-- Ensures that core quiz tables exist before refactors:
-- questions, red_flags, quiz_sessions, question_responses, survey_responses,
-- kpi_target, quiz_responses, quiz_responses_backup_20250920, _quiz_session_map

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Minimal questions table with legacy JSON answers column
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_index INTEGER,
    question_text TEXT NOT NULL,
    category TEXT,
    content JSONB,
    result JSONB,
    answers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.red_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    flag_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    anonymous_user_id VARCHAR(255),
    total_questions INTEGER NOT NULL DEFAULT 10,
    completed_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '45 days'),
    total_summary_score NUMERIC NOT NULL DEFAULT 0,
    tmp_old_fake_id BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS quiz_sessions_session_id_key ON public.quiz_sessions(session_id);

-- Question responses (pre-normalised structure)
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    selected_answer_id UUID,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    kpi_category VARCHAR(255),
    question_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    device_type TEXT,
    user_agent TEXT
);

-- Optional survey responses tied to sessions
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    total_score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    age_group TEXT,
    education TEXT,
    occupation TEXT,
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL
);

-- KPI target metadata storage (legacy structure)
CREATE TABLE IF NOT EXISTS public.kpi_target (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    unit TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy quiz responses summary
CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    session_id TEXT NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    device_type TEXT,
    user_agent TEXT,
    quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL
);

-- Backup table for imported responses
CREATE TABLE IF NOT EXISTS public.quiz_responses_backup_20250920 (
    id UUID,
    created_at TIMESTAMPTZ,
    session_id TEXT,
    total_questions INTEGER,
    correct_answers INTEGER,
    device_type TEXT,
    user_agent TEXT
);

-- Mapping from legacy session identifiers
CREATE TABLE IF NOT EXISTS public._quiz_session_map (
    fake_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
