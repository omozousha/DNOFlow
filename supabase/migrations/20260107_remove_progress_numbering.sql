-- Migration: Remove numbering from progress field values
-- Date: 2026-01-07
-- Description: Update existing progress values to remove numeric prefixes (e.g., "01. CREATED BOQ" → "CREATED BOQ")

-- Update progress field to remove numbering
UPDATE projects
SET progress = CASE
  WHEN progress = '00. PENDING / HOLD' THEN 'PENDING / HOLD'
  WHEN progress = '01. CREATED BOQ' THEN 'CREATED BOQ'
  WHEN progress = '02. CHECKED BOQ' THEN 'CHECKED BOQ'
  WHEN progress = '03. BEP' THEN 'BEP'
  WHEN progress = '04. APPROVED' THEN 'APPROVED'
  WHEN progress = '05. SPK SURVEY' THEN 'SPK SURVEY'
  WHEN progress = '06. SURVEY' THEN 'SURVEY'
  WHEN progress = '07. DRM' THEN 'DRM'
  WHEN progress = '08. APPROVED BOQ DRM' THEN 'APPROVED BOQ DRM'
  WHEN progress = '09. SPK' THEN 'SPK'
  WHEN progress = '10. MOS' THEN 'MOS'
  WHEN progress = '11. PERIZINAN' THEN 'PERIZINAN'
  WHEN progress = '12. CONST' THEN 'CONST'
  WHEN progress = '13. COMMTEST' THEN 'COMMTEST'
  WHEN progress = '14. UT' THEN 'UT'
  WHEN progress = '15. REKON' THEN 'REKON'
  WHEN progress = '16. BAST' THEN 'BAST'
  WHEN progress = '17. BALOP' THEN 'BALOP'
  WHEN progress = '18. DONE' THEN 'DONE'
  ELSE progress
END
WHERE progress LIKE '0_.%' OR progress LIKE '1_.%';

-- Add comment to track migration
COMMENT ON COLUMN projects.progress IS 'Project progress stage (without numeric prefix). Updated 2026-01-07 to remove numbering.';
