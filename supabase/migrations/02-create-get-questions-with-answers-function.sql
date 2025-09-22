-- Create the missing get_questions_with_answers function
CREATE OR REPLACE FUNCTION get_questions_with_answers()
RETURNS TABLE(
  id UUID,
  question_text TEXT,
  category TEXT,
  content JSONB,
  result JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  order_index INTEGER,
  answers JSONB,
  normal_image_url TEXT,
  result_image_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.category,
    q.content,
    q.result,
    q.created_at,
    q.updated_at,
    q.order_index,
    -- Aggregate answers into JSON array
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'answer_text', a.answer_text,
          'is_correct', a.is_correct,
          'explanation', a.explanation
        )
      ) FILTER (WHERE a.id IS NOT NULL),
      '[]'::jsonb
    ) as answers,
    -- Get the first scenario image as normal_image_url
    COALESCE(
      (SELECT si.image_url
       FROM scenario_images si
       WHERE si.question_id = q.id
         AND si.variant = 'normal'
       LIMIT 1),
      ''::TEXT
    ) as normal_image_url,
    -- Get the first scenario image as result_image_url (or different logic if needed)
    COALESCE(
      (SELECT si.image_url
       FROM scenario_images si
       WHERE si.question_id = q.id
         AND si.variant = 'result'
       LIMIT 1),
      ''::TEXT
    ) as result_image_url
  FROM questions q
  LEFT JOIN answers a ON a.question_id = q.id
  GROUP BY q.id, q.question_text, q.category, q.content, q.result, q.created_at, q.updated_at, q.order_index
  ORDER BY q.order_index;
END;
$$;
