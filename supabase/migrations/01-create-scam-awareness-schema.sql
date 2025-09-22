-- ========================================
-- 📊 CORE TABLES: Quiz System
-- ========================================

-- 1. Questions (Content Management)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index INTEGER NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  category TEXT, -- Optional grouping
  content JSONB, -- UI content (images, scenarios, etc.)
  result JSONB, -- Result explanations
  kpi_category TEXT NOT NULL CHECK (kpi_category IN (
    'SCAM_RECOGNITION', 
    'RISK_ASSESSMENT', 
    'PROTECTIVE_ACTIONS', 
    'RESPONSE_STRATEGIES'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Answers (Multiple choice options)
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  explanation TEXT, -- Why this answer is correct/wrong
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz Sessions (User quiz attempts)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL, -- Public identifier
  anonymous_user_id TEXT, -- Optional tracking
  device_fingerprint TEXT, -- Browser fingerprint
  
  -- Progress tracking
  total_questions INTEGER NOT NULL DEFAULT 10,
  completed_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  
  -- Final scores
  total_summary_score NUMERIC(5,2) DEFAULT 0, -- 0-100%
  
  -- Session status
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_time_ms INTEGER, -- Total time taken
  
  -- Cleanup
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '45 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Question Responses (Individual answers with KPI mapping)
CREATE TABLE IF NOT EXISTS question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_answer_id UUID REFERENCES answers(id),
  
  -- Response data
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  response_time_ms INTEGER, -- Time to answer this question
  question_order INTEGER NOT NULL, -- 1-10
  
  -- KPI mapping (derived from question)
  kpi_category TEXT NOT NULL,
  
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one response per question per session
  UNIQUE(quiz_session_id, question_id),
  UNIQUE(quiz_session_id, question_order)
);

-- ========================================
-- 📋 SURVEY & ANALYTICS TABLES
-- ========================================

-- 5. Survey Responses (Demographics linked to quiz sessions)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
  
  -- Demographics
  age_group TEXT NOT NULL,
  education TEXT NOT NULL,
  occupation TEXT NOT NULL,
  
  -- Optional additional data
  province TEXT,
  internet_usage TEXT,
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. KPI Targets (Configuration for reporting)
CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_category TEXT UNIQUE NOT NULL CHECK (kpi_category IN (
    'SCAM_RECOGNITION', 
    'RISK_ASSESSMENT', 
    'PROTECTIVE_ACTIONS', 
    'RESPONSE_STRATEGIES'
  )),
  target_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00, -- 80%
  total_questions INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 🎨 SUPPORT TABLES (UI/UX)
-- ========================================

-- 7. Red Flags (UI indicators)
CREATE TABLE IF NOT EXISTS red_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  flag_text TEXT NOT NULL,
  flag_type TEXT DEFAULT 'warning', -- warning, danger, info
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Scenario Images (Question assets)
CREATE TABLE IF NOT EXISTS scenario_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('normal', 'result')),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 📊 INDEXES (Performance Optimization)
-- ========================================

-- Quiz Sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_session_id ON quiz_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions(is_completed, completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);

-- Question Responses
CREATE INDEX IF NOT EXISTS idx_question_responses_session ON question_responses(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question ON question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_kpi ON question_responses(kpi_category);
CREATE INDEX IF NOT EXISTS idx_question_responses_created_at ON question_responses(answered_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_kpi ON questions(kpi_category);

-- Survey Responses
CREATE INDEX IF NOT EXISTS idx_survey_responses_session ON survey_responses(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted ON survey_responses(submitted_at);

-- ========================================
-- 🔧 FUNCTIONS (Business Logic)
-- ========================================

-- Function: Calculate total summary score for a session
CREATE OR REPLACE FUNCTION calculate_total_summary_score(session_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_score NUMERIC := 0;
BEGIN
  SELECT 
    ROUND(
      (COUNT(CASE WHEN is_correct THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2
    )
  INTO total_score
  FROM question_responses 
  WHERE quiz_session_id = session_uuid;
  
  RETURN COALESCE(total_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get KPI scores by category for a session
CREATE OR REPLACE FUNCTION calculate_kpi_scores(session_uuid UUID)
RETURNS TABLE(
  kpi_category TEXT,
  correct_answers INTEGER,
  total_questions INTEGER,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qr.kpi_category,
    COUNT(CASE WHEN qr.is_correct THEN 1 END)::INTEGER as correct_answers,
    COUNT(*)::INTEGER as total_questions,
    ROUND(
      (COUNT(CASE WHEN qr.is_correct THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2
    ) as percentage
  FROM question_responses qr
  WHERE qr.quiz_session_id = session_uuid
  GROUP BY qr.kpi_category;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update total summary score when responses change
CREATE OR REPLACE FUNCTION trigger_update_total_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the quiz session's total summary score
  UPDATE quiz_sessions 
  SET 
    total_summary_score = calculate_total_summary_score(NEW.quiz_session_id),
    completed_questions = (
      SELECT COUNT(*) FROM question_responses 
      WHERE quiz_session_id = NEW.quiz_session_id
    ),
    correct_answers = (
      SELECT COUNT(*) FROM question_responses 
      WHERE quiz_session_id = NEW.quiz_session_id AND is_correct = TRUE
    )
  WHERE id = NEW.quiz_session_id;
  
  -- Mark as completed if all questions answered
  UPDATE quiz_sessions 
  SET 
    is_completed = (completed_questions >= total_questions),
    completed_at = CASE 
      WHEN completed_questions >= total_questions AND completed_at IS NULL 
      THEN NOW() 
      ELSE completed_at 
    END,
    completion_time_ms = CASE 
      WHEN completed_questions >= total_questions AND completion_time_ms IS NULL 
      THEN EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
      ELSE completion_time_ms 
    END
  WHERE id = NEW.quiz_session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM quiz_sessions 
  WHERE expires_at < NOW() AND is_completed = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ⚡ TRIGGERS (Automation)
-- ========================================

-- Auto-update scores when question responses change
DROP TRIGGER IF EXISTS trigger_update_quiz_scores ON question_responses;
CREATE TRIGGER trigger_update_quiz_scores
  AFTER INSERT OR UPDATE OR DELETE ON question_responses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_total_score();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_questions_updated_at ON questions;
CREATE TRIGGER trigger_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 📊 ANALYTICS VIEWS (Real-time KPI Calculation)
-- ========================================

-- View 1: KPI Summary (Main dashboard data)
CREATE OR REPLACE VIEW quiz_kpi_summary AS
SELECT 
  qs.session_id,
  qs.anonymous_user_id,
  qs.total_summary_score,
  qs.total_questions,
  qs.completed_questions,
  qs.correct_answers,
  qs.is_completed,
  qs.completion_time_ms,
  
  -- KPI Percentages by Category
  ROUND(AVG(CASE WHEN qr.kpi_category = 'SCAM_RECOGNITION' 
    THEN CASE WHEN qr.is_correct THEN 100.0 ELSE 0.0 END END), 2) 
    as scam_recognition_percentage,
    
  ROUND(AVG(CASE WHEN qr.kpi_category = 'RISK_ASSESSMENT' 
    THEN CASE WHEN qr.is_correct THEN 100.0 ELSE 0.0 END END), 2) 
    as risk_assessment_percentage,
    
  ROUND(AVG(CASE WHEN qr.kpi_category = 'PROTECTIVE_ACTIONS' 
    THEN CASE WHEN qr.is_correct THEN 100.0 ELSE 0.0 END END), 2) 
    as protective_actions_percentage,
    
  ROUND(AVG(CASE WHEN qr.kpi_category = 'RESPONSE_STRATEGIES' 
    THEN CASE WHEN qr.is_correct THEN 100.0 ELSE 0.0 END END), 2) 
    as response_strategies_percentage,
  
  -- Question counts and correct counts by category
  COUNT(CASE WHEN qr.kpi_category = 'SCAM_RECOGNITION' THEN 1 END) as scam_recognition_questions,
  COUNT(CASE WHEN qr.kpi_category = 'SCAM_RECOGNITION' AND qr.is_correct THEN 1 END) as scam_recognition_correct,
  
  COUNT(CASE WHEN qr.kpi_category = 'RISK_ASSESSMENT' THEN 1 END) as risk_assessment_questions,
  COUNT(CASE WHEN qr.kpi_category = 'RISK_ASSESSMENT' AND qr.is_correct THEN 1 END) as risk_assessment_correct,
  
  COUNT(CASE WHEN qr.kpi_category = 'PROTECTIVE_ACTIONS' THEN 1 END) as protective_actions_questions,
  COUNT(CASE WHEN qr.kpi_category = 'PROTECTIVE_ACTIONS' AND qr.is_correct THEN 1 END) as protective_actions_correct,
  
  COUNT(CASE WHEN qr.kpi_category = 'RESPONSE_STRATEGIES' THEN 1 END) as response_strategies_questions,
  COUNT(CASE WHEN qr.kpi_category = 'RESPONSE_STRATEGIES' AND qr.is_correct THEN 1 END) as response_strategies_correct,
  
  qs.created_at
FROM quiz_sessions qs
LEFT JOIN question_responses qr ON qs.id = qr.quiz_session_id
GROUP BY qs.id, qs.session_id, qs.anonymous_user_id, qs.total_summary_score, 
         qs.total_questions, qs.completed_questions, qs.correct_answers, 
         qs.is_completed, qs.completion_time_ms, qs.created_at;

-- View 2: Question Most Wrong Analysis (Content optimization)
CREATE OR REPLACE VIEW question_difficulty_analysis WITH (security_invoker=on) AS
SELECT 
  q.id AS question_id,
  q.question_text,
  q.category,
  q.order_index,
  q.kpi_category,

  -- Question Statistics
  COUNT(qr.id) AS total_attempts,
  COUNT(CASE WHEN qr.is_correct THEN 1 END) AS correct_attempts,
  COUNT(CASE WHEN NOT qr.is_correct THEN 1 END) AS wrong_attempts,

  -- Percentages (with NULLIF to prevent division by zero)
  ROUND(
    (COUNT(CASE WHEN qr.is_correct THEN 1 END)::NUMERIC / NULLIF(COUNT(qr.id), 0)) * 100, 2
  ) AS success_rate,

  ROUND(
    (COUNT(CASE WHEN NOT qr.is_correct THEN 1 END)::NUMERIC / NULLIF(COUNT(qr.id), 0)) * 100, 2
  ) AS wrong_rate,

  -- Average Response Time
  ROUND(AVG(qr.response_time_ms)::NUMERIC, 0) AS avg_response_time_ms

FROM questions q
LEFT JOIN question_responses qr ON q.id = qr.question_id
GROUP BY q.id, q.question_text, q.category, q.order_index, q.kpi_category
ORDER BY wrong_attempts DESC NULLS LAST, total_attempts DESC;

-- View 3: KPI Performance Summary (Target comparison)
CREATE OR REPLACE VIEW kpi_performance_summary AS
SELECT 
  kt.kpi_category,
  kt.target_percentage,
  kt.total_questions,
  kt.description,
  
  -- Current Performance
  COUNT(qr.id) as total_responses,
  COUNT(CASE WHEN qr.is_correct THEN 1 END) as correct_responses,
  
  ROUND(
    (COUNT(CASE WHEN qr.is_correct THEN 1 END)::NUMERIC / NULLIF(COUNT(qr.id), 0)) * 100, 2
  ) as current_success_rate,
  
  -- Target comparison
  CASE 
    WHEN ROUND((COUNT(CASE WHEN qr.is_correct THEN 1 END)::NUMERIC / NULLIF(COUNT(qr.id), 0)) * 100, 2) >= kt.target_percentage 
    THEN TRUE 
    ELSE FALSE 
  END as meets_target,
  
  -- Recent data only (last 45 days)
  COUNT(CASE WHEN qr.answered_at >= NOW() - INTERVAL '45 days' THEN 1 END) as recent_responses

FROM kpi_targets kt
LEFT JOIN question_responses qr ON kt.kpi_category = qr.kpi_category
WHERE kt.is_active = TRUE
GROUP BY kt.kpi_category, kt.target_percentage, kt.total_questions, kt.description
ORDER BY kt.kpi_category;

-- View 4: Daily Analytics Summary (Trends)
CREATE OR REPLACE VIEW quiz_analytics_summary AS
SELECT 
  DATE(qs.created_at) as quiz_date,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN qs.is_completed THEN 1 END) as completed_sessions,
  
  ROUND(
    (COUNT(CASE WHEN qs.is_completed THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2
  ) as completion_rate,
  
  ROUND(AVG(qs.total_summary_score), 2) as avg_total_score,
  ROUND(AVG(qs.completion_time_ms), 0) as avg_completion_time_ms,
  
  -- KPI averages for the day
  ROUND(AVG((SELECT scam_recognition_percentage FROM quiz_kpi_summary WHERE session_id = qs.session_id)), 2) as avg_scam_recognition,
  ROUND(AVG((SELECT risk_assessment_percentage FROM quiz_kpi_summary WHERE session_id = qs.session_id)), 2) as avg_risk_assessment,
  ROUND(AVG((SELECT protective_actions_percentage FROM quiz_kpi_summary WHERE session_id = qs.session_id)), 2) as avg_protective_actions,
  ROUND(AVG((SELECT response_strategies_percentage FROM quiz_kpi_summary WHERE session_id = qs.session_id)), 2) as avg_response_strategies

FROM quiz_sessions qs
WHERE qs.created_at >= NOW() - INTERVAL '90 days' -- Last 90 days
GROUP BY DATE(qs.created_at)
ORDER BY quiz_date DESC;

-- ========================================
-- 🎯 INITIAL DATA: KPI Targets
-- ========================================

-- Insert default KPI targets
INSERT INTO kpi_targets (kpi_category, target_percentage, total_questions, description) 
VALUES 
  ('SCAM_RECOGNITION', 80.00, 3, 'ความสามารถในการจำแนกรูปแบบการหลอกลวง'),
  ('RISK_ASSESSMENT', 80.00, 2, 'การประเมินระดับความเสี่ยงและภัยคุกคาม'),
  ('PROTECTIVE_ACTIONS', 80.00, 3, 'ความรู้เกี่ยวกับมาตรการป้องกันและความปลอดภัย'),
  ('RESPONSE_STRATEGIES', 80.00, 2, 'กลยุทธ์การตอบสนองที่เหมาะสมต่อการหลอกลวง')
ON CONFLICT (kpi_category) DO UPDATE SET
  target_percentage = EXCLUDED.target_percentage,
  total_questions = EXCLUDED.total_questions,
  description = EXCLUDED.description;

-- ========================================
-- 🧹 MAINTENANCE: Scheduled cleanup job
-- ========================================

-- Create extension for scheduling (if not exists)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup of expired sessions (uncomment if pg_cron available)
-- SELECT cron.schedule('cleanup-expired-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- ========================================
-- ✅ SCHEMA VALIDATION QUERIES
-- ========================================

-- Verify schema integrity
DO $$
BEGIN
  -- Check that all tables exist
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN (
    'questions', 'answers', 'quiz_sessions', 'question_responses', 
    'survey_responses', 'kpi_targets', 'red_flags', 'scenario_images'
  )) = 8, 'Not all required tables were created';
  
  -- Check that all views exist
  ASSERT (SELECT COUNT(*) FROM information_schema.views WHERE table_name IN (
    'quiz_kpi_summary', 'question_difficulty_analysis', 
    'kpi_performance_summary', 'quiz_analytics_summary'
  )) = 4, 'Not all required views were created';
  
  -- Check that KPI targets are inserted
  ASSERT (SELECT COUNT(*) FROM kpi_targets WHERE is_active = TRUE) = 4, 
    'KPI targets not properly inserted';
  
  RAISE NOTICE '✅ Schema validation passed - all tables, views, and data created successfully!';
END $$;

-- ========================================
-- 📋 USAGE EXAMPLES
-- ========================================

/*
-- Example 1: Create a new quiz session
INSERT INTO quiz_sessions (session_id, anonymous_user_id) 
VALUES ('quiz_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8), 'user_123');

-- Example 2: Record a question response (auto-triggers score calculation)
INSERT INTO question_responses (quiz_session_id, question_id, selected_answer_id, is_correct, response_time_ms, question_order, kpi_category)
VALUES (
  (SELECT id FROM quiz_sessions WHERE session_id = 'quiz_1234567890_abcd1234'),
  (SELECT id FROM questions WHERE order_index = 1),
  (SELECT id FROM answers WHERE question_id = (SELECT id FROM questions WHERE order_index = 1) AND is_correct = TRUE),
  TRUE,
  15000,
  1,
  'SCAM_RECOGNITION'
);

-- Example 3: Get KPI summary for dashboard
SELECT * FROM quiz_kpi_summary WHERE is_completed = TRUE ORDER BY created_at DESC LIMIT 10;

-- Example 4: Get question difficulty for content optimization
SELECT * FROM question_difficulty_analysis ORDER BY failure_rate DESC LIMIT 5;

-- Example 5: Check KPI performance vs targets
SELECT * FROM kpi_performance_summary;
*/
