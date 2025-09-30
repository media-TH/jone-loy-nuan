-- Enforce 'user_' prefix on quiz_sessions.anonymous_user_id
-- 1) Trigger function to auto-prefix on INSERT/UPDATE
CREATE OR REPLACE FUNCTION enforce_user_prefix_quiz_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anonymous_user_id IS NOT NULL AND LEFT(NEW.anonymous_user_id, 5) <> 'user_' THEN
    NEW.anonymous_user_id := 'user_' || NEW.anonymous_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger binding
DROP TRIGGER IF EXISTS trg_enforce_user_prefix_quiz_sessions ON quiz_sessions;
CREATE TRIGGER trg_enforce_user_prefix_quiz_sessions
  BEFORE INSERT OR UPDATE OF anonymous_user_id ON quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_user_prefix_quiz_sessions();

-- 3) CHECK constraint for additional safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_quiz_sessions_anonymous_user_id_user_prefix'
  ) THEN
    ALTER TABLE quiz_sessions
      ADD CONSTRAINT chk_quiz_sessions_anonymous_user_id_user_prefix
      CHECK (anonymous_user_id IS NULL OR LEFT(anonymous_user_id, 5) = 'user_');
  END IF;
END $$;
