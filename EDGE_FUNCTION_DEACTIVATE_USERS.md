# Edge Function: Deactivate Inactive Users

## Overview
Edge Function yang berjalan secara otomatis untuk menonaktifkan user yang tidak login selama 3 hari atau lebih, **dengan exception untuk admin**.

## Function Details

**Name:** `deactivate-inactive-users`  
**Status:** ✅ ACTIVE (Deployed)  
**Version:** 1  
**Verify JWT:** No (menggunakan service role key)

## Logic

### Deactivation Rules:
1. ✅ User dengan `last_login` < 3 hari yang lalu
2. ✅ User dengan `is_active = true` (hanya yang aktif)
3. ✅ **EXCLUDE admin role** - Admin tidak pernah di-deactivate
4. ✅ Update `is_active = false`

### SQL Query Equivalent:
```sql
UPDATE profiles 
SET is_active = false 
WHERE last_login < (NOW() - INTERVAL '3 days')
  AND is_active = true
  AND role != 'admin';  -- Admin exception
```

## Function URL

**Endpoint:**
```
https://efxyhgmnrplittfahgzu.supabase.co/functions/v1/deactivate-inactive-users
```

## Manual Testing

### Test via cURL:
```bash
curl -X POST https://efxyhgmnrplittfahgzu.supabase.co/functions/v1/deactivate-inactive-users \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test via JavaScript:
```javascript
const response = await fetch(
  'https://efxyhgmnrplittfahgzu.supabase.co/functions/v1/deactivate-inactive-users',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
);
const result = await response.json();
console.log(result);
```

### Expected Response:
```json
{
  "success": true,
  "message": "Successfully deactivated 2 inactive users",
  "deactivatedCount": 2,
  "deactivatedUsers": [
    {
      "email": "user1@example.com",
      "name": "User One",
      "lastLogin": "2025-12-28T10:30:00Z",
      "role": "owner"
    },
    {
      "email": "user2@example.com",
      "name": "User Two",
      "lastLogin": "2025-12-27T15:45:00Z",
      "role": "controller"
    }
  ],
  "timestamp": "2026-01-01T00:00:00Z",
  "threshold": "2025-12-29T00:00:00Z"
}
```

## Automatic Scheduling

### Option 1: Supabase Cron (Recommended)

**Setup via Supabase Dashboard:**
1. Go to **Database** → **Cron Jobs**
2. Click **Create a new cron job**
3. Configure:
   - **Name:** Deactivate Inactive Users
   - **Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
   - **Query:**
     ```sql
     SELECT net.http_post(
       url := 'https://efxyhgmnrplittfahgzu.supabase.co/functions/v1/deactivate-inactive-users',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     ) as response;
     ```

**Schedule Options:**
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight

### Option 2: GitHub Actions

Create `.github/workflows/deactivate-users.yml`:
```yaml
name: Deactivate Inactive Users

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  deactivate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }} \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Option 3: External Cron Service

Use services like:
- **cron-job.org** - Free cron service
- **EasyCron** - Scheduled HTTP requests
- **Vercel Cron** - If hosting on Vercel

Setup:
1. Create HTTP POST request
2. URL: Function endpoint
3. Header: `Authorization: Bearer YOUR_ANON_KEY`
4. Schedule: Daily at specific time

## Monitoring & Logs

### View Edge Function Logs:
1. Go to **Supabase Dashboard**
2. **Edge Functions** → `deactivate-inactive-users`
3. Click **Logs** tab

### Expected Log Output:
```
[Deactivate Users] Starting at 2026-01-01T02:00:00.000Z
[Deactivate Users] Threshold: 2025-12-29T02:00:00.000Z
[Deactivate Users] Deactivated 2 users
[Deactivate Users] Deactivated users: [...]
```

### Check via SQL:
```sql
-- Check recent deactivations
SELECT 
  email, 
  full_name, 
  role,
  last_login, 
  is_active,
  updated_at
FROM profiles
WHERE is_active = false
  AND updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC;
```

## Admin Exception Verification

### Test Admin Protection:
```sql
-- Set admin last_login to old date
UPDATE profiles 
SET last_login = NOW() - INTERVAL '10 days'
WHERE role = 'admin';

-- Run function (manually or via cron)
-- Admin should remain is_active = true

-- Verify admin still active
SELECT email, role, last_login, is_active 
FROM profiles 
WHERE role = 'admin';
```

**Expected:** Admin users will **NOT** be deactivated regardless of `last_login` date.

## Security

### Environment Variables (Auto-configured):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for bypassing RLS

### Why `verify_jwt = false`:
- Function needs to run automatically without user authentication
- Protected by service role key
- Only callable via POST request
- Can add API key protection if needed

### Optional: Add API Key Protection:
```typescript
// Add to edge function
const apiKey = req.headers.get('x-api-key');
if (apiKey !== Deno.env.get('CRON_API_KEY')) {
  return new Response('Unauthorized', { status: 401 });
}
```

## Rollback Plan

If you need to revert deactivations:
```sql
-- Reactivate all users deactivated in last 24 hours
UPDATE profiles 
SET is_active = true
WHERE is_active = false
  AND updated_at > NOW() - INTERVAL '1 day';

-- Or reactivate specific users
UPDATE profiles 
SET is_active = true
WHERE email IN ('user1@example.com', 'user2@example.com');
```

## Next Steps

1. ✅ **Edge Function Deployed** - Function is live and ready
2. ⏳ **Setup Cron Schedule** - Configure automatic execution
3. ⏳ **Monitor First Run** - Check logs after first execution
4. ⏳ **Verify Admin Exception** - Ensure admins stay active
5. ⏳ **Document Incident Response** - How to handle false positives

## Troubleshooting

### Function Not Deactivating Users:
1. Check function logs for errors
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check RLS policies on profiles table
4. Verify threshold calculation (3 days)

### Admins Being Deactivated:
1. Check admin user role value: `SELECT role FROM profiles WHERE role = 'admin'`
2. Verify `.neq('role', 'admin')` in function code
3. Check function logs for SQL query

### False Positives:
1. Check `last_login` timestamps
2. Verify time zone calculations
3. Consider adjusting threshold (3 days → 7 days)

## Change Inactivity Threshold

To change from 3 days to different value:

```typescript
// Current (3 days)
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

// Change to 7 days
threeDaysAgo.setDate(threeDaysAgo.getDate() - 7);

// Change to 1 day
threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);
```

Then redeploy:
```bash
supabase functions deploy deactivate-inactive-users
```

## Testing Checklist

- [ ] Manual test via cURL/browser
- [ ] Verify response JSON structure
- [ ] Test with user who has old last_login
- [ ] Test admin exception (admin with old last_login)
- [ ] Check function logs
- [ ] Verify audit log entries
- [ ] Test reactivation on next login
- [ ] Setup cron schedule
- [ ] Monitor first automatic run

---

**Status:** ✅ Function Deployed & Ready  
**Last Updated:** 2026-01-01  
**Next Action:** Setup cron schedule for automatic execution
