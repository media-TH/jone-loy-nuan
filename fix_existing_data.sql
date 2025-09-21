-- Fix existing data without deleting

-- 1. Update existing questions to have proper KPI categories
UPDATE public.questions
SET kpi_category_id = (SELECT id FROM public.kpi_categories WHERE slug = 'SCAM_RECOGNITION')
WHERE order_index IN (1, 2, 3);

UPDATE public.questions
SET kpi_category_id = (SELECT id FROM public.kpi_categories WHERE slug = 'RISK_ASSESSMENT')
WHERE order_index IN (4, 5);

UPDATE public.questions
SET kpi_category_id = (SELECT id FROM public.kpi_categories WHERE slug = 'PROTECTIVE_ACTIONS')
WHERE order_index IN (6, 7, 8);

UPDATE public.questions
SET kpi_category_id = (SELECT id FROM public.kpi_categories WHERE slug = 'RESPONSE_STRATEGIES')
WHERE order_index IN (9, 10);

-- 2. Update existing quiz_sessions to have device types
UPDATE public.quiz_sessions
SET device_type = CASE
    WHEN random() < 0.6 THEN 'mobile'
    WHEN random() < 0.8 THEN 'desktop'
    ELSE 'tablet'
END
WHERE device_type IS NULL;

-- 3. Create sample question_responses for existing completed sessions
INSERT INTO public.question_responses (
    id, quiz_session_id, question_id, selected_answer_id, is_correct,
    response_time_ms, kpi_category_id, question_order, created_at
)
SELECT DISTINCT
    gen_random_uuid(),
    qs.id,
    q.id,
    (SELECT a.id FROM public.answers a WHERE a.question_id = q.id ORDER BY random() LIMIT 1),
    random() > 0.25, -- 75% success rate on average
    (random() * 30000 + 5000)::integer,
    q.kpi_category_id,
    q.order_index,
    qs.created_at
FROM public.quiz_sessions qs
CROSS JOIN public.questions q
WHERE qs.is_completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.question_responses qr
    WHERE qr.quiz_session_id = qs.id AND qr.question_id = q.id
  )
ORDER BY qs.id, q.order_index;