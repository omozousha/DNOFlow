# Backend Verification Checklist - Progress Format Update

## ✅ Completed Updates

### 1. **Frontend Code** ✅
- [x] Update all PROGRESS constants to remove numbering
- [x] Update PROGRESS_MAPPING objects
- [x] Update validation arrays (VALID_PROGRESS)
- [x] Update help documentation
- [x] Update CSV template

### 2. **Backend Compatibility** ✅
- [x] statusKeyMap supports both old and new formats
- [x] API routes don't have hardcoded progress values
- [x] No hardcoded progress in utility functions

### 3. **Database Migration** ✅
- [x] Created migration SQL file: `20260107_remove_progress_numbering.sql`
- [x] Created verification script: `verify_progress_migration.sql`
- [x] Created automated migration runner: `migrate-progress-format.mjs`

---

## 🚀 Migration Steps

### Step 1: Backup Database
```bash
# Using Supabase CLI
supabase db dump -f backup_before_progress_migration.sql

# Or via psql
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

### Step 2: Run Verification Query
```bash
# Check how many projects need migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/verify_progress_migration.sql
```

### Step 3: Apply Migration

**Option A: Using SQL Migration (Recommended)**
```bash
# Apply via Supabase CLI
supabase db push

# Or via psql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20260107_remove_progress_numbering.sql
```

**Option B: Using Node.js Script**
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Run migration script
node scripts/migrate-progress-format.mjs
```

### Step 4: Verify Migration
```bash
# Check if any old format remains
psql -h your-db-host -U postgres -d postgres -c "
  SELECT COUNT(*) as old_format_count
  FROM projects
  WHERE progress LIKE '0_.%' OR progress LIKE '1_.%';
"
```

---

## 🔍 What the Migration Does

### SQL Update Query
```sql
UPDATE projects
SET progress = CASE
  WHEN progress = '01. CREATED BOQ' THEN 'CREATED BOQ'
  WHEN progress = '10. MOS' THEN 'MOS'
  -- ... (all 20 progress values)
  ELSE progress
END
WHERE progress LIKE '0_.%' OR progress LIKE '1_.%';
```

### Affected Fields
- **Table:** `projects`
- **Column:** `progress`
- **Rows Affected:** Only projects with old numbering format (e.g., "01. CREATED BOQ")
- **Safe:** Uses CASE statement to only update matching values

---

## 🛡️ Safety Checks

### Pre-Migration Checklist
- [ ] Database backup completed
- [ ] Verification query shows expected count
- [ ] No active transactions or long-running queries
- [ ] Service maintenance window scheduled (if needed)

### Post-Migration Verification
- [ ] Run verification query: No old format remains
- [ ] Test frontend: Create new project works
- [ ] Test frontend: Update project works
- [ ] Test frontend: Import Excel works
- [ ] Test dashboard: Filters work correctly
- [ ] Check RLS policies: Still functional

### Rollback Plan
If migration fails or causes issues:
```sql
-- Restore from backup
psql -h your-db-host -U postgres -d postgres < backup_before_progress_migration.sql

-- Or manual rollback (reverse mapping)
UPDATE projects
SET progress = CASE
  WHEN progress = 'CREATED BOQ' THEN '01. CREATED BOQ'
  WHEN progress = 'MOS' THEN '10. MOS'
  -- ... (reverse all mappings)
  ELSE progress
END;
```

---

## 📊 Expected Results

### Before Migration
```
SELECT progress, COUNT(*) FROM projects GROUP BY progress;

progress            | count
--------------------+-------
01. CREATED BOQ     |   15
10. MOS             |   23
12. CONST           |   42
18. DONE            |   31
```

### After Migration
```
SELECT progress, COUNT(*) FROM projects GROUP BY progress;

progress            | count
--------------------+-------
CREATED BOQ         |   15
MOS                 |   23
CONST               |   42
DONE                |   31
```

---

## 🔧 Troubleshooting

### Issue: Migration script not connecting
**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
node -e "
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Connection test:', supabase);
"
```

### Issue: Some projects not updated
**Solution:**
```sql
-- Check for edge cases
SELECT DISTINCT progress
FROM projects
WHERE progress LIKE '%BOQ%' OR progress LIKE '%MOS%'
ORDER BY progress;

-- Manual update if needed
UPDATE projects
SET progress = 'CREATED BOQ'
WHERE progress ILIKE '%created%boq%';
```

### Issue: RLS policies not working
**Solution:**
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'projects';

-- Re-enable RLS if needed
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Post-Migration Tasks

1. **Clear Application Cache**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Update Documentation**
   - [x] Update BACKEND_RLS_DOCUMENTATION.md
   - [x] Update help page
   - [x] Update CSV template

3. **Notify Team**
   - Inform users about progress format change
   - Update training materials if any
   - Update API documentation

4. **Monitor**
   - Check error logs for any issues
   - Monitor database performance
   - Watch for user-reported issues

---

## 📝 Notes

- **Backward Compatibility:** The `statusKeyMap` in `controller/page.tsx` supports both old and new formats for read operations
- **New Data:** All new projects will automatically use the new format (without numbers)
- **Import:** Excel import validates against new format only
- **Impact:** Zero downtime - old format still readable, new format used for all writes
- **Performance:** No index changes needed, no performance impact

---

## 🎯 Success Criteria

✅ Migration is successful when:
1. ✅ No projects have progress values like "01. CREATED BOQ"
2. ✅ All projects have clean progress values like "CREATED BOQ"
3. ✅ Frontend create/update/import all work correctly
4. ✅ Dashboard filters work correctly
5. ✅ No errors in application logs
6. ✅ RLS policies still enforcing correctly
