-- Backend Verification Script
-- Run this to verify database is ready for progress format change

-- 1. Check if there are any projects with old numbering format
SELECT 
  COUNT(*) as projects_with_old_format,
  STRING_AGG(DISTINCT progress, ', ') as old_progress_values
FROM projects
WHERE progress LIKE '0_.%' OR progress LIKE '1_.%';

-- 2. Check current progress values distribution
SELECT 
  progress,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM projects
WHERE progress IS NOT NULL
GROUP BY progress
ORDER BY count DESC;

-- 3. Verify PROGRESS_MAPPING compatibility
-- Check if all progress values map to valid status
SELECT 
  progress,
  status,
  uic,
  COUNT(*) as count
FROM projects
WHERE progress IS NOT NULL
GROUP BY progress, status, uic
ORDER BY progress;

-- 4. Check for any unmapped progress values
SELECT DISTINCT progress
FROM projects
WHERE progress IS NOT NULL
  AND progress NOT IN (
    'REJECT',
    'PENDING / HOLD',
    'CREATED BOQ',
    'CHECKED BOQ',
    'BEP',
    'APPROVED',
    'SPK SURVEY',
    'SURVEY',
    'DRM',
    'APPROVED BOQ DRM',
    'SPK',
    'MOS',
    'PERIZINAN',
    'CONST',
    'COMMTEST',
    'UT',
    'REKON',
    'BAST',
    'BALOP',
    'DONE',
    -- Also check old format for migration tracking
    '00. PENDING / HOLD',
    '01. CREATED BOQ',
    '02. CHECKED BOQ',
    '03. BEP',
    '04. APPROVED',
    '05. SPK SURVEY',
    '06. SURVEY',
    '07. DRM',
    '08. APPROVED BOQ DRM',
    '09. SPK',
    '10. MOS',
    '11. PERIZINAN',
    '12. CONST',
    '13. COMMTEST',
    '14. UT',
    '15. REKON',
    '16. BAST',
    '17. BALOP',
    '18. DONE'
  );

-- 5. Verify RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'projects'
ORDER BY policyname;

-- 6. Check indexes on progress column
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'projects'
  AND indexdef LIKE '%progress%';
