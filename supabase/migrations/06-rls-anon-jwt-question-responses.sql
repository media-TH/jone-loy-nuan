-- RLS for question_responses: anon เห็น/สร้าง/อัปเดต ได้แค่แถวที่ quiz_session เป็นของตัวเอง
-- ใช้ auth.jwt() ->> 'anon_user_id' ผ่าน policy ที่เช็กผ่าน quiz_sessions

ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- Helper: true ถ้า JWT anon_user_id ตรงกับ anonymous_user_id ของแถว (รองรับทั้ง 'user_<id>' และ '<id>')
CREATE OR REPLACE FUNCTION public.anon_jwt_matches_session(session_anonymous_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (auth.jwt() ->> 'anon_user_id') IS NOT NULL
    AND (
      (auth.jwt() ->> 'anon_user_id') = session_anonymous_user_id
      OR session_anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
    );
$$;

-- SELECT: เห็นแค่ response ที่ quiz_session เป็นของตัวเอง
CREATE POLICY "anon_jwt_select_question_responses"
ON public.question_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs
    WHERE qs.id = question_responses.quiz_session_id
    AND public.anon_jwt_matches_session(qs.anonymous_user_id)
  )
);

-- INSERT: สร้างได้แค่เมื่อ quiz_session เป็นของตัวเอง
CREATE POLICY "anon_jwt_insert_question_responses"
ON public.question_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs
    WHERE qs.id = question_responses.quiz_session_id
    AND public.anon_jwt_matches_session(qs.anonymous_user_id)
  )
);

-- UPDATE: อัปเดตได้แค่แถวที่ quiz_session เป็นของตัวเอง
CREATE POLICY "anon_jwt_update_question_responses"
ON public.question_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs
    WHERE qs.id = question_responses.quiz_session_id
    AND public.anon_jwt_matches_session(qs.anonymous_user_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_sessions qs
    WHERE qs.id = question_responses.quiz_session_id
    AND public.anon_jwt_matches_session(qs.anonymous_user_id)
  )
);

-- ไม่สร้าง policy DELETE — แอปไม่มีการลบ; ถ้าอนาคตมี "ลบประวัติ" ค่อยเพิ่ม policy ให้ anon ลบแค่ของตัวเองได้
