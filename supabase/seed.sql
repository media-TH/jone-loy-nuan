-- Insert test data for analytics dashboard

-- Insert sample KPI categories data (should already exist from migrations)
INSERT INTO public.kpi_categories (slug, display_name, description, question_count)
VALUES
  ('SCAM_RECOGNITION', 'Scam Recognition', 'Identify common scam signals', 3),
  ('RISK_ASSESSMENT', 'Risk Assessment', 'Judge threat levels and next steps', 2),
  ('PROTECTIVE_ACTIONS', 'Protective Actions', 'Choose safe preventative actions', 3),
  ('RESPONSE_STRATEGIES', 'Response Strategies', 'Decide how to respond after detection', 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample quiz sessions with device types
INSERT INTO public.quiz_sessions (
  id, session_id, anonymous_user_id, total_questions, completed_questions,
  correct_answers, is_completed, device_type, user_agent, created_at
) VALUES
  (gen_random_uuid(), 'session_001', 'user_001', 10, 10, 8, true, 'mobile', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'session_002', 'user_002', 10, 10, 7, true, 'desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'session_003', 'user_003', 10, 10, 9, true, 'mobile', 'Mozilla/5.0 (Android 11; Mobile)', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'session_004', 'user_004', 10, 5, 3, false, 'tablet', 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'session_005', 'user_005', 10, 10, 6, true, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'session_006', 'user_006', 10, 8, 5, false, 'mobile', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', NOW()),
  (gen_random_uuid(), 'session_007', 'user_007', 10, 10, 8, true, 'mobile', 'Mozilla/5.0 (Android 12; Mobile)', NOW()),
  (gen_random_uuid(), 'session_008', 'user_008', 10, 10, 7, true, 'desktop', 'Mozilla/5.0 (Windows NT 11.0; Win64; x64)', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'session_009', 'user_009', 10, 10, 9, true, 'tablet', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), 'session_010', 'user_010', 10, 6, 4, false, 'mobile', 'Mozilla/5.0 (Android 10; Mobile)', NOW() - INTERVAL '5 days')
ON CONFLICT (session_id) DO NOTHING;

-- Clear existing data first
DELETE FROM public.question_responses;
DELETE FROM public.answers;
DELETE FROM public.questions;

-- Insert sample questions with proper KPI categories
INSERT INTO public.questions (
  id, question_text, order_index, content, result, kpi_category_id, created_at
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'คุณได้รับ SMS ที่บอกว่าบัญชีธนาคารของคุณถูกระงับ และให้คลิกลิงก์เพื่อยืนยันตัวตน คุณจะทำอย่างไร?',
    1,
    '{"type": "text", "data": "คุณได้รับ SMS ที่บอกว่าบัญชีธนาคารของคุณถูกระงับ และให้คลิกลิงก์เพื่อยืนยันตัวตน"}',
    '{"correctTitle": "ถูกต้อง!", "wrongTitle": "ผิด!", "header": "การระบุ SMS หลอกลวง", "explanation": "ธนาคารจะไม่ส่ง SMS ให้คลิกลิงก์เพื่อยืนยันตัวตน ควรโทรสอบธนาคารโดยตรง"}',
    (SELECT id FROM public.kpi_categories WHERE slug = 'SCAM_RECOGNITION'),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'เมื่อพบเว็บไซต์ที่ให้ผลตอบแทนสูงผิดปกติ คุณควรประเมินความเสี่ยงอย่างไร?',
    2,
    '{"type": "text", "data": "เว็บไซต์ลงทุนที่ให้ผลตอบแทน 50% ต่อเดือน"}',
    '{"correctTitle": "ถูกต้อง!", "wrongTitle": "ผิด!", "header": "การประเมินความเสี่ยง", "explanation": "ผลตอบแทนสูงผิดปกติเป็นสัญญาณเตือนการหลอกลวง ควรตรวจสอบใบอนุญาตและข้อมูลบริษัท"}',
    (SELECT id FROM public.kpi_categories WHERE slug = 'RISK_ASSESSMENT'),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'หากคุณสงสัยว่าข้อมูลส่วนตัวอาจรั่วไหล ควรทำอย่างไรเป็นอันดับแรก?',
    3,
    '{"type": "text", "data": "การป้องกันเมื่อข้อมูลส่วนตัวรั่วไหล"}',
    '{"correctTitle": "ถูกต้อง!", "wrongTitle": "ผิด!", "header": "มาตรการป้องกัน", "explanation": "ควรเปลี่ยนรหัสผ่านทุกบัญชีที่สำคัญทันที และติดตามการเคลื่อนไหวในบัญชีธนาคาร"}',
    (SELECT id FROM public.kpi_categories WHERE slug = 'PROTECTIVE_ACTIONS'),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'หลังจากตกเป็นเหยื่อการหลอกลวงแล้ว คุณควรทำอย่างไรเป็นอันดับแรก?',
    4,
    '{"type": "text", "data": "การตอบสนองหลังถูกหลอกลวง"}',
    '{"correctTitle": "ถูกต้อง!", "wrongTitle": "ผิด!", "header": "กลยุทธ์การตอบสนอง", "explanation": "ควรแจ้งความทันทีและติดต่อธนาคารเพื่อระงับบัญชี"}',
    (SELECT id FROM public.kpi_categories WHERE slug = 'RESPONSE_STRATEGIES'),
    NOW()
  );

-- Insert answers for all questions
DO $$
BEGIN
    -- Question 1 answers (SCAM_RECOGNITION)
    INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
        ('a10e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'คลิกลิงก์ทันทีเพื่อยืนยันตัวตน', false),
        ('a10e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'โทรสอบธนาคารโดยตรงก่อน', true),
        ('a10e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'ไม่สนใจข้อความนี้', false),
        ('a10e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'ส่งต่อให้เพื่อนเพื่อให้ช่วยดู', false);

    -- Question 2 answers (RISK_ASSESSMENT)
    INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
        ('a20e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'ลงทุนทันทีเพราะได้กำไรสูง', false),
        ('a20e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'ตรวจสอบใบอนุญาตและข้อมูลบริษัทก่อน', true),
        ('a20e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'ลงทุนเงินเล็กน้อยก่อนเพื่อทดสอบ', false),
        ('a20e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'ถามเพื่อนว่าเคยลงทุนแล้วได้เงินจริงไหม', false);

    -- Question 3 answers (PROTECTIVE_ACTIONS)
    INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
        ('a30e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'รอดูก่อนว่าจะเกิดอะไรขึ้น', false),
        ('a30e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'เปลี่ยนรหัสผ่านทุกบัญชีทันที', true),
        ('a30e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'แจ้งตำรวจไซเบอร์ก่อน', false),
        ('a30e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'ปิดบัญชีโซเชียลมีเดียทั้งหมด', false);

    -- Question 4 answers (RESPONSE_STRATEGIES)
    INSERT INTO public.answers (id, question_id, answer_text, is_correct) VALUES
        ('a40e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'อายมาก ไม่บอกใคร', false),
        ('a40e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'แจ้งความทันทีและติดต่อธนาคาร', true),
        ('a40e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'ลองติดตามเงินด้วยตัวเอง', false),
        ('a40e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'โพสต์เตือนในโซเชียลก่อน', false);

    -- Insert sample question responses to make views work
    INSERT INTO public.question_responses (
        id, quiz_session_id, question_id, selected_answer_id, is_correct,
        response_time_ms, kpi_category_id, question_order, created_at
    )
    SELECT
        gen_random_uuid(),
        qs.id,
        '550e8400-e29b-41d4-a716-446655440001',
        CASE
            WHEN random() > 0.3 THEN 'a10e8400-e29b-41d4-a716-446655440002' -- correct answer
            ELSE 'a10e8400-e29b-41d4-a716-446655440001' -- wrong answer
        END,
        random() > 0.3, -- 70% success rate
        (random() * 30000 + 5000)::integer,
        (SELECT id FROM public.kpi_categories WHERE slug = 'SCAM_RECOGNITION'),
        1,
        qs.created_at
    FROM public.quiz_sessions qs
    WHERE qs.is_completed = true;

    INSERT INTO public.question_responses (
        id, quiz_session_id, question_id, selected_answer_id, is_correct,
        response_time_ms, kpi_category_id, question_order, created_at
    )
    SELECT
        gen_random_uuid(),
        qs.id,
        '550e8400-e29b-41d4-a716-446655440002',
        CASE
            WHEN random() > 0.4 THEN 'a20e8400-e29b-41d4-a716-446655440002' -- correct
            ELSE 'a20e8400-e29b-41d4-a716-446655440001' -- wrong
        END,
        random() > 0.4, -- 60% success rate
        (random() * 30000 + 5000)::integer,
        (SELECT id FROM public.kpi_categories WHERE slug = 'RISK_ASSESSMENT'),
        2,
        qs.created_at
    FROM public.quiz_sessions qs
    WHERE qs.is_completed = true;

    INSERT INTO public.question_responses (
        id, quiz_session_id, question_id, selected_answer_id, is_correct,
        response_time_ms, kpi_category_id, question_order, created_at
    )
    SELECT
        gen_random_uuid(),
        qs.id,
        '550e8400-e29b-41d4-a716-446655440003',
        CASE
            WHEN random() > 0.2 THEN 'a30e8400-e29b-41d4-a716-446655440002' -- correct
            ELSE 'a30e8400-e29b-41d4-a716-446655440001' -- wrong
        END,
        random() > 0.2, -- 80% success rate
        (random() * 30000 + 5000)::integer,
        (SELECT id FROM public.kpi_categories WHERE slug = 'PROTECTIVE_ACTIONS'),
        3,
        qs.created_at
    FROM public.quiz_sessions qs
    WHERE qs.is_completed = true;

    INSERT INTO public.question_responses (
        id, quiz_session_id, question_id, selected_answer_id, is_correct,
        response_time_ms, kpi_category_id, question_order, created_at
    )
    SELECT
        gen_random_uuid(),
        qs.id,
        '550e8400-e29b-41d4-a716-446655440004',
        CASE
            WHEN random() > 0.5 THEN 'a40e8400-e29b-41d4-a716-446655440002' -- correct
            ELSE 'a40e8400-e29b-41d4-a716-446655440003' -- wrong
        END,
        random() > 0.5, -- 50% success rate
        (random() * 30000 + 5000)::integer,
        (SELECT id FROM public.kpi_categories WHERE slug = 'RESPONSE_STRATEGIES'),
        4,
        qs.created_at
    FROM public.quiz_sessions qs
    WHERE qs.is_completed = true;

END $$;