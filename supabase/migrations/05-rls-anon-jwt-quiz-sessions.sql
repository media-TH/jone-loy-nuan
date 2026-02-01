-- RLS for quiz_sessions using anon JWT claim (auth.jwt() ->> 'anon_user_id').
-- Requires client to send JWT from anon-token Edge Function; JWT must be signed with project JWT secret.
-- Supports both anon_user_id in JWT as 'user_<id>' or '<id>' (DB stores with user_ prefix via trigger).

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: user sees only their sessions
CREATE POLICY "anon_jwt_select_quiz_sessions"
ON public.quiz_sessions
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
);

-- INSERT: user can only insert rows where anonymous_user_id matches their JWT
CREATE POLICY "anon_jwt_insert_quiz_sessions"
ON public.quiz_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
);

-- UPDATE: user can only update their own sessions
CREATE POLICY "anon_jwt_update_quiz_sessions"
ON public.quiz_sessions
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
)
WITH CHECK (
  (auth.jwt() ->> 'anon_user_id') IS NOT NULL
  AND (
    (auth.jwt() ->> 'anon_user_id') = anonymous_user_id
    OR anonymous_user_id = ('user_' || (auth.jwt() ->> 'anon_user_id'))
  )
);

-- ไม่สร้าง policy DELETE — แอปไม่มีการลบ session; ถ้าอนาคตมี "ลบประวัติ" ค่อยเพิ่ม
