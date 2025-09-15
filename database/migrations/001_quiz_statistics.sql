-- 🔥 Quiz Statistics Migration
-- Created by: ตุ๊กตา (Tuktah) 
-- Purpose: Track user quiz responses and analytics

-- 1. KPI Categories (Mock data - จะแก้ทีหลัง)
CREATE TABLE kpi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert mock KPI categories
INSERT INTO kpi_categories (name, description, display_order) VALUES
('SCAM_RECOGNITION', 'ความสามารถในการจดจำรูปแบบการหลอกลวง', 1),
('RISK_ASSESSMENT', 'การประเมินความเสี่ยงและอันตราย', 2),
('PROTECTIVE_ACTIONS', 'การดำเนินการป้องกันตนเอง', 3),
('RESPONSE_STRATEGIES', 'กลยุทธ์การตอบสนองเมื่อพบการหลอกลวง', 4);

-- 2. Add KPI category to existing questions table
ALTER TABLE questions 
ADD COLUMN kpi_category_id UUID REFERENCES kpi_categories(id);

-- 3. Quiz Responses (Summary level)
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    
    -- 🆕 Per-User Tracking (Anonymous)
    anonymous_user_id TEXT, -- persistent browser ID (localStorage)
    user_fingerprint TEXT,  -- browser fingerprint hash
    
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    completion_time_ms INTEGER, -- เวลารวมทั้ง quiz
    device_type TEXT,
    user_agent TEXT,
    ip_address INET, -- สำหรับ basic geo analytics
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Data retention & privacy
    is_anonymous BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '45 days')
);

-- 4. Individual Responses (Detail level)
CREATE TABLE individual_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_response_id UUID REFERENCES quiz_responses(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    selected_answer_id UUID REFERENCES answers(id),
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    
    -- Denormalized for analytics performance
    question_category TEXT, -- จาก questions.category
    kpi_category TEXT,      -- จาก kpi_categories.name
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Performance Indexes
CREATE INDEX idx_quiz_responses_created_at ON quiz_responses(created_at);
CREATE INDEX idx_quiz_responses_session_id ON quiz_responses(session_id);
CREATE INDEX idx_quiz_responses_expires_at ON quiz_responses(expires_at);
CREATE INDEX idx_quiz_responses_anonymous_user_id ON quiz_responses(anonymous_user_id);
CREATE INDEX idx_quiz_responses_user_fingerprint ON quiz_responses(user_fingerprint);

CREATE INDEX idx_individual_responses_quiz_response_id ON individual_responses(quiz_response_id);
CREATE INDEX idx_individual_responses_question_id ON individual_responses(question_id);
CREATE INDEX idx_individual_responses_is_correct ON individual_responses(is_correct);
CREATE INDEX idx_individual_responses_kpi_category ON individual_responses(kpi_category);
CREATE INDEX idx_individual_responses_created_at ON individual_responses(created_at);

-- 6. Analytics Views for Dashboard
CREATE VIEW quiz_analytics_summary AS
SELECT 
    DATE(qr.created_at) as quiz_date,
    COUNT(*) as total_sessions,
    AVG(qr.correct_answers::float / qr.total_questions) as avg_accuracy,
    AVG(qr.completion_time_ms) as avg_completion_time_ms,
    COUNT(DISTINCT qr.session_id) as unique_sessions
FROM quiz_responses qr
WHERE qr.created_at >= NOW() - INTERVAL '45 days'
GROUP BY DATE(qr.created_at)
ORDER BY quiz_date DESC;

CREATE VIEW question_performance_analysis AS
SELECT 
    q.id,
    q.question_text,
    q.category,
    kc.name as kpi_category,
    COUNT(ir.id) as total_attempts,
    AVG(CASE WHEN ir.is_correct THEN 1.0 ELSE 0.0 END) as success_rate,
    AVG(ir.response_time_ms) as avg_response_time_ms,
    -- Performance score (lower = harder for users)
    ROUND((AVG(CASE WHEN ir.is_correct THEN 1.0 ELSE 0.0 END) * 100), 1) as performance_score
FROM questions q
LEFT JOIN kpi_categories kc ON q.kpi_category_id = kc.id
LEFT JOIN individual_responses ir ON q.id = ir.question_id
WHERE ir.created_at >= NOW() - INTERVAL '45 days' OR ir.created_at IS NULL
GROUP BY q.id, q.question_text, q.category, kc.name
ORDER BY performance_score ASC; -- คำถามที่ตอบผิดบ่อยก่อน

CREATE VIEW kpi_performance_summary AS
SELECT 
    ir.kpi_category,
    COUNT(*) as total_responses,
    AVG(CASE WHEN ir.is_correct THEN 1.0 ELSE 0.0 END) as accuracy_rate,
    AVG(ir.response_time_ms) as avg_response_time_ms,
    COUNT(DISTINCT ir.quiz_response_id) as unique_sessions
FROM individual_responses ir
WHERE ir.created_at >= NOW() - INTERVAL '45 days'
AND ir.kpi_category IS NOT NULL
GROUP BY ir.kpi_category
ORDER BY accuracy_rate DESC;

-- 7. Data Cleanup Function (Auto-delete after 45 days)
CREATE OR REPLACE FUNCTION cleanup_expired_quiz_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired quiz responses (CASCADE will handle individual_responses)
    DELETE FROM quiz_responses 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('quiz_data_cleanup', 
            json_build_object('deleted_sessions', deleted_count), 
            NOW())
    ON CONFLICT DO NOTHING; -- Ignore if system_logs table doesn't exist
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Useful Analytics Functions
CREATE OR REPLACE FUNCTION get_quiz_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    metric TEXT,
    value NUMERIC,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'total_sessions'::TEXT,
        COUNT(*)::NUMERIC,
        'Total quiz sessions in period'::TEXT
    FROM quiz_responses 
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    
    UNION ALL
    
    SELECT 
        'avg_accuracy'::TEXT,
        ROUND(AVG(correct_answers::float / total_questions) * 100, 2)::NUMERIC,
        'Average accuracy percentage'::TEXT
    FROM quiz_responses 
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    
    UNION ALL
    
    SELECT 
        'avg_completion_time'::TEXT,
        ROUND(AVG(completion_time_ms) / 1000, 1)::NUMERIC,
        'Average completion time in seconds'::TEXT
    FROM quiz_responses 
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND completion_time_ms IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Comments for documentation
COMMENT ON TABLE quiz_responses IS 'Summary data for each quiz session - anonymous users only';
COMMENT ON TABLE individual_responses IS 'Detailed response data for each question answered';
COMMENT ON TABLE kpi_categories IS 'KPI categories for measuring different aspects of scam awareness';

COMMENT ON COLUMN quiz_responses.session_id IS 'Unique session identifier (not linked to user accounts)';
COMMENT ON COLUMN quiz_responses.expires_at IS 'Auto-deletion date (45 days from creation)';
COMMENT ON COLUMN individual_responses.kpi_category IS 'Denormalized KPI category name for fast analytics';

-- 10. Grant permissions (adjust as needed)
-- GRANT SELECT ON quiz_analytics_summary TO analytics_role;
-- GRANT SELECT ON question_performance_analysis TO analytics_role;
-- GRANT SELECT ON kpi_performance_summary TO analytics_role;
-- 📊 An
swer Pattern Analysis Views (เพิ่มเติมสำหรับ Answer Statistics)

-- Answer Selection Distribution
CREATE VIEW answer_pattern_analysis AS
SELECT 
    q.id as question_id,
    q.question_text,
    a.id as answer_id,
    a.answer_text,
    a.is_correct,
    COUNT(ir.id) as times_selected,
    ROUND(COUNT(ir.id) * 100.0 / 
          NULLIF(SUM(COUNT(ir.id)) OVER (PARTITION BY q.id), 0), 1) as selection_percentage,
    ROUND(AVG(ir.response_time_ms), 0) as avg_response_time_ms
FROM questions q
JOIN answers a ON q.id = a.question_id
LEFT JOIN individual_responses ir ON a.id = ir.selected_answer_id
    AND ir.created_at >= NOW() - INTERVAL '45 days'
GROUP BY q.id, q.question_text, a.id, a.answer_text, a.is_correct
ORDER BY q.order_index, a.is_correct DESC, times_selected DESC;

-- Wrong Answer Hotspots (คำตอบผิดที่ถูกเลือกบ่อย)
CREATE VIEW wrong_answer_hotspots AS
SELECT 
    q.id as question_id,
    q.question_text,
    q.category,
    a.answer_text as popular_wrong_answer,
    COUNT(*) as times_selected,
    ROUND(COUNT(*) * 100.0 / 
          SUM(COUNT(*)) OVER (PARTITION BY q.id), 1) as wrong_answer_percentage,
    ROUND(AVG(ir.response_time_ms), 0) as avg_thinking_time_ms
FROM individual_responses ir
JOIN questions q ON ir.question_id = q.id  
JOIN answers a ON ir.selected_answer_id = a.id
WHERE ir.is_correct = false 
    AND ir.created_at >= NOW() - INTERVAL '45 days'
GROUP BY q.id, q.question_text, q.category, a.id, a.answer_text
HAVING COUNT(*) >= 3 -- อย่างน้อย 3 คนเลือก
ORDER BY times_selected DESC;

-- Distractor Effectiveness (คำตอบล่อที่ดีที่สุด)
CREATE VIEW distractor_effectiveness AS
SELECT 
    q.id as question_id,
    q.question_text,
    a.answer_text as distractor_text,
    COUNT(*) as fooled_count,
    ROUND(AVG(ir.response_time_ms), 0) as avg_decision_time_ms,
    -- Effectiveness score: จำนวนคนที่หลง + เวลาที่ใช้คิด
    ROUND((COUNT(*) * 10) + (AVG(ir.response_time_ms) / 1000), 1) as effectiveness_score
FROM individual_responses ir
JOIN questions q ON ir.question_id = q.id
JOIN answers a ON ir.selected_answer_id = a.id  
WHERE a.is_correct = false
    AND ir.created_at >= NOW() - INTERVAL '45 days'
GROUP BY q.id, q.question_text, a.id, a.answer_text
HAVING COUNT(*) >= 2 -- อย่างน้อย 2 คนเลือก
ORDER BY effectiveness_score DESC;

-- Answer Analytics Function
CREATE OR REPLACE FUNCTION get_answer_insights(question_id_param UUID)
RETURNS TABLE (
    answer_text TEXT,
    is_correct BOOLEAN,
    selection_count BIGINT,
    selection_percentage NUMERIC,
    avg_response_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.answer_text,
        a.is_correct,
        COUNT(ir.id) as selection_count,
        ROUND(COUNT(ir.id) * 100.0 / 
              NULLIF(SUM(COUNT(ir.id)) OVER (), 0), 1) as selection_percentage,
        ROUND(AVG(ir.response_time_ms), 0) as avg_response_time_ms
    FROM answers a
    LEFT JOIN individual_responses ir ON a.id = ir.selected_answer_id
        AND ir.question_id = question_id_param
        AND ir.created_at >= NOW() - INTERVAL '45 days'
    WHERE a.question_id = question_id_param
    GROUP BY a.id, a.answer_text, a.is_correct
    ORDER BY a.is_correct DESC, selection_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON VIEW answer_pattern_analysis IS 'Shows how often each answer choice is selected';
COMMENT ON VIEW wrong_answer_hotspots IS 'Identifies most commonly selected wrong answers';
COMMENT ON VIEW distractor_effectiveness IS 'Ranks distractors by how well they fool users';
-- 👤 
Per-User Analytics Views

-- User Progress Tracking (นาย A ตอบถูกข้อไหนบ้าง)
CREATE VIEW user_progress_detail AS
SELECT 
    qr.anonymous_user_id,
    qr.created_at as quiz_date,
    qr.id as quiz_session_id,
    qr.total_questions,
    qr.correct_answers,
    ROUND(qr.correct_answers * 100.0 / qr.total_questions, 1) as accuracy_percentage,
    ir.question_id,
    q.question_text,
    q.category,
    ir.kpi_category,
    ir.is_correct,
    ir.response_time_ms,
    a.answer_text as selected_answer
FROM quiz_responses qr
JOIN individual_responses ir ON qr.id = ir.quiz_response_id
JOIN questions q ON ir.question_id = q.id
JOIN answers a ON ir.selected_answer_id = a.id
WHERE qr.anonymous_user_id IS NOT NULL
ORDER BY qr.anonymous_user_id, qr.created_at DESC, q.order_index;

-- User Learning Progress (การพัฒนาของแต่ละคน)
CREATE VIEW user_learning_progress AS
SELECT 
    anonymous_user_id,
    COUNT(*) as total_attempts,
    AVG(correct_answers * 100.0 / total_questions) as avg_accuracy,
    MIN(created_at) as first_attempt,
    MAX(created_at) as latest_attempt,
    
    -- Progress trend (เทียบครั้งแรกกับครั้งล่าสุด)
    CASE 
        WHEN COUNT(*) = 1 THEN NULL
        ELSE (
            SELECT AVG(correct_answers * 100.0 / total_questions) 
            FROM quiz_responses qr2 
            WHERE qr2.anonymous_user_id = qr.anonymous_user_id 
            AND qr2.created_at >= (
                SELECT MAX(created_at) - INTERVAL '7 days' 
                FROM quiz_responses qr3 
                WHERE qr3.anonymous_user_id = qr.anonymous_user_id
            )
        ) - (
            SELECT AVG(correct_answers * 100.0 / total_questions) 
            FROM quiz_responses qr2 
            WHERE qr2.anonymous_user_id = qr.anonymous_user_id 
            AND qr2.created_at <= (
                SELECT MIN(created_at) + INTERVAL '7 days' 
                FROM quiz_responses qr3 
                WHERE qr3.anonymous_user_id = qr.anonymous_user_id
            )
        )
    END as improvement_percentage
FROM quiz_responses qr
WHERE anonymous_user_id IS NOT NULL
GROUP BY anonymous_user_id
ORDER BY total_attempts DESC;

-- User KPI Strengths & Weaknesses
CREATE VIEW user_kpi_performance AS
SELECT 
    qr.anonymous_user_id,
    ir.kpi_category,
    COUNT(*) as questions_attempted,
    AVG(CASE WHEN ir.is_correct THEN 1.0 ELSE 0.0 END) as accuracy_rate,
    AVG(ir.response_time_ms) as avg_response_time_ms,
    
    -- Rank ใน KPI นี้เทียบกับคนอื่น
    PERCENT_RANK() OVER (
        PARTITION BY ir.kpi_category 
        ORDER BY AVG(CASE WHEN ir.is_correct THEN 1.0 ELSE 0.0 END)
    ) as percentile_rank
FROM quiz_responses qr
JOIN individual_responses ir ON qr.id = ir.quiz_response_id
WHERE qr.anonymous_user_id IS NOT NULL 
    AND ir.kpi_category IS NOT NULL
GROUP BY qr.anonymous_user_id, ir.kpi_category
ORDER BY qr.anonymous_user_id, accuracy_rate DESC;

-- Functions for User Analytics
CREATE OR REPLACE FUNCTION get_user_quiz_history(user_id_param TEXT)
RETURNS TABLE (
    quiz_date TIMESTAMPTZ,
    score_percentage NUMERIC,
    total_questions INTEGER,
    correct_answers INTEGER,
    completion_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qr.created_at,
        ROUND(qr.correct_answers * 100.0 / qr.total_questions, 1),
        qr.total_questions,
        qr.correct_answers,
        ROUND(qr.completion_time_ms / 1000.0, 1)
    FROM quiz_responses qr
    WHERE qr.anonymous_user_id = user_id_param
    ORDER BY qr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_wrong_answers(user_id_param TEXT)
RETURNS TABLE (
    question_text TEXT,
    correct_answer TEXT,
    user_selected TEXT,
    times_wrong INTEGER,
    kpi_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.question_text,
        correct_a.answer_text as correct_answer,
        wrong_a.answer_text as user_selected,
        COUNT(*)::INTEGER as times_wrong,
        ir.kpi_category
    FROM quiz_responses qr
    JOIN individual_responses ir ON qr.id = ir.quiz_response_id
    JOIN questions q ON ir.question_id = q.id
    JOIN answers wrong_a ON ir.selected_answer_id = wrong_a.id
    JOIN answers correct_a ON q.id = correct_a.question_id AND correct_a.is_correct = true
    WHERE qr.anonymous_user_id = user_id_param 
        AND ir.is_correct = false
    GROUP BY q.id, q.question_text, correct_a.answer_text, wrong_a.answer_text, ir.kpi_category
    ORDER BY times_wrong DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON VIEW user_progress_detail IS 'Detailed quiz history for each anonymous user';
COMMENT ON VIEW user_learning_progress IS 'Learning progress and improvement trends per user';
COMMENT ON VIEW user_kpi_performance IS 'KPI-specific performance analysis per user';