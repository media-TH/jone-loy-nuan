-- ============================================
-- Verification Queries for Anonymous User ID Fix
-- ============================================
-- Date: 2025-10-01
-- Purpose: Verify that anonymous_user_id no longer contains Mozilla UA strings
-- ============================================

-- 1. Check for any Mozilla UA strings (should return 0)
-- ============================================
SELECT 
  COUNT(*) as mozilla_ua_count,
  'Should be 0' as expected
FROM quiz_sessions 
WHERE anonymous_user_id LIKE 'Mozilla/%'
   OR anonymous_user_id LIKE '%AppleWebKit%'
   OR anonymous_user_id LIKE '%Chrome/%'
   OR anonymous_user_id LIKE '%Safari/%';

-- 2. Verify all IDs have user_ prefix (should return 0)
-- ============================================
SELECT 
  COUNT(*) as missing_prefix_count,
  'Should be 0' as expected
FROM quiz_sessions 
WHERE anonymous_user_id IS NOT NULL 
  AND anonymous_user_id != ''
  AND anonymous_user_id NOT LIKE 'user_%';

-- 3. Sample recent entries (visual inspection)
-- ============================================
SELECT 
  id,
  session_id,
  anonymous_user_id,
  device_fingerprint,
  user_agent,
  created_at,
  is_completed
FROM quiz_sessions
ORDER BY created_at DESC
LIMIT 20;

-- 4. Count entries by date (trend analysis)
-- ============================================
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN anonymous_user_id LIKE 'user_%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN anonymous_user_id LIKE 'Mozilla/%' THEN 1 END) as mozilla_ua,
  ROUND(
    COUNT(CASE WHEN anonymous_user_id LIKE 'user_%' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as correct_percentage
FROM quiz_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. Check for duplicate prefixes (should return 0)
-- ============================================
SELECT 
  COUNT(*) as duplicate_prefix_count,
  'Should be 0' as expected
FROM quiz_sessions 
WHERE anonymous_user_id LIKE 'user_user_%';

-- 6. Validate UUID format after prefix
-- ============================================
SELECT 
  id,
  anonymous_user_id,
  LENGTH(anonymous_user_id) as id_length,
  CASE 
    WHEN anonymous_user_id ~ '^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'Valid UUID'
    WHEN anonymous_user_id ~ '^user_[0-9a-f]{32}$'
    THEN 'Valid UUID (no hyphens)'
    ELSE 'Invalid format'
  END as format_status
FROM quiz_sessions
WHERE anonymous_user_id IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check trigger is working (test with sample data)
-- ============================================
-- This should auto-prefix if trigger is active
-- DO NOT RUN IN PRODUCTION - FOR TESTING ONLY
/*
BEGIN;
  INSERT INTO quiz_sessions (
    session_id,
    anonymous_user_id,
    total_questions,
    device_fingerprint
  ) VALUES (
    'test_' || gen_random_uuid()::text,
    gen_random_uuid()::text,  -- No prefix
    10,
    'desktop'
  ) RETURNING id, anonymous_user_id;
ROLLBACK;
*/

-- 8. Statistics summary
-- ============================================
SELECT 
  'Total Sessions' as metric,
  COUNT(*) as value
FROM quiz_sessions
UNION ALL
SELECT 
  'With Anonymous ID',
  COUNT(*)
FROM quiz_sessions
WHERE anonymous_user_id IS NOT NULL
UNION ALL
SELECT 
  'Correct Format (user_)',
  COUNT(*)
FROM quiz_sessions
WHERE anonymous_user_id LIKE 'user_%'
UNION ALL
SELECT 
  'Mozilla UA (Bad)',
  COUNT(*)
FROM quiz_sessions
WHERE anonymous_user_id LIKE 'Mozilla/%'
UNION ALL
SELECT 
  'Created Last 24h',
  COUNT(*)
FROM quiz_sessions
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 9. Check constraint is active
-- ============================================
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'quiz_sessions'::regclass
  AND conname LIKE '%anonymous_user_id%';

-- 10. Check trigger is active
-- ============================================
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'quiz_sessions'::regclass
  AND tgname LIKE '%user_prefix%';

-- ============================================
-- Expected Results Summary:
-- ============================================
-- Query 1: mozilla_ua_count = 0
-- Query 2: missing_prefix_count = 0
-- Query 3: All anonymous_user_id should start with 'user_'
-- Query 4: correct_percentage should be 100% for recent dates
-- Query 5: duplicate_prefix_count = 0
-- Query 6: All should show 'Valid UUID' format
-- Query 8: Mozilla UA (Bad) = 0
-- Query 9: Should show constraint exists
-- Query 10: Should show trigger exists and is enabled
-- ============================================
