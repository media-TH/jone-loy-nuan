-- ========================================
-- 🗑️ ROLLBACK: DROP QUIZ_RESPONSES TABLE
-- ========================================

-- Drop quiz_responses table since we use quiz_sessions instead
DROP TABLE IF EXISTS quiz_responses CASCADE;

-- ========================================
-- ✅ SCHEMA VALIDATION
-- ========================================

-- Verify the table is dropped
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'quiz_responses') = 0,
         'quiz_responses table was not dropped';

  RAISE NOTICE '✅ quiz_responses table dropped successfully!';
END $$;
