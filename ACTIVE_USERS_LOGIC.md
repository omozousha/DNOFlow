# Active Users Logic Documentation

## Overview
System ini menggunakan `is_active` flag di tabel `profiles` untuk mengontrol akses user ke aplikasi. User dianggap **inactive** jika tidak login selama **3 hari atau lebih**.

---

## Frontend Logic

### 1. **Login Process** ([login-form.tsx](src/components/login-form.tsx))
**Saat user berhasil login:**
```typescript
await supabase.from('profiles').update({ 
  last_login: new Date().toISOString(), 
  is_active: true 
}).eq('id', data.user.id);
```
- ✅ Update `last_login` dengan timestamp saat ini
- ✅ Set `is_active = true` (reaktivasi otomatis jika sebelumnya inactive)

**Behavior:**
- User yang di-nonaktifkan akan aktif kembali saat login

---

### 2. **Auth Context** ([auth-context.tsx](src/contexts/auth-context.tsx))
**Fetch Profile dengan RLS Check:**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('id,email,role,full_name,division,position,is_active,access')
  .eq('id', userId)
  .single();

// Force logout if inactive
if (data.is_active === false) {
  setProfile(null);
  setUser(null);
  setSession(null);
  toast.error('Akun Anda dinonaktifkan.');
  router.push('/login');
  return;
}
```

**Behavior:**
- Cek `is_active` setiap kali fetch profile
- Jika `is_active = false`, logout paksa dan redirect ke login
- Toast notification muncul: "Akun Anda dinonaktifkan."

---

### 3. **Middleware Protection** ([middleware.ts](src/middleware.ts))
**Server-side validation pada setiap request:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_active')
  .eq('id', session.user.id)
  .single();

// Block inactive users
if (!profile?.is_active) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.searchParams.set('error', 'inactive');
  await supabase.auth.signOut();
  return NextResponse.redirect(redirectUrl);
}
```

**Behavior:**
- Validasi di **server-side** sebelum akses protected routes
- Sign out otomatis jika inactive
- Redirect ke `/login?error=inactive`

---

### 4. **Admin Dashboard** ([admin-dashboard-content.tsx](src/components/dashboard/admin-dashboard-content.tsx))
**Display Active Users Count:**
```typescript
const { count: activeUsers } = await supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('is_active', true);

const inactiveUsers = (totalUsers || 0) - (activeUsers || 0);
```

**Metrics Displayed:**
- Total Users
- Active Users
- Inactive Users (calculated)

---

## Backend Logic

### 1. **Deactivation Script** ([scripts/deactivate-inactive-users.ts](scripts/deactivate-inactive-users.ts))

**Manual/Scheduled Execution:**
```typescript
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const { error } = await supabase
  .from('profiles')
  .update({ is_active: false })
  .lt('last_login', threeDaysAgo)
  .eq('is_active', true);
```

**Logic:**
- Cari users dengan `last_login < 3 hari yang lalu`
- Update `is_active = false`
- Hanya affect users yang saat ini `is_active = true`

**⚠️ CURRENT STATUS:**
- Script ada tapi **TIDAK** berjalan otomatis
- **pg_cron extension TIDAK installed** di Supabase
- Perlu dijalankan manual atau setup external cron job

**Cara Run Manual:**
```bash
ts-node scripts/deactivate-inactive-users.ts
```

---

### 2. **Database Triggers**
**Audit Trigger:**
- Setiap perubahan di `profiles` (termasuk `is_active`) di-log ke `profiles_audit_log`
- Trigger: `profiles_audit_trigger` (AFTER INSERT/UPDATE/DELETE)

**Update Timestamp Trigger:**
- `updated_at` column di-update otomatis setiap ada perubahan

---

## Flow Diagram

### User Login Flow:
```
1. User login → signInWithPassword()
2. Login success → Update last_login + is_active = true
3. Fetch profile → Check is_active
4. If inactive → Force logout + toast error
5. If active → Allow access
```

### Middleware Check Flow:
```
1. Protected route request
2. Middleware checks session
3. Fetch profile → Check is_active
4. If inactive → Sign out + redirect to /login?error=inactive
5. If active → Allow request
```

### Deactivation Flow (Manual):
```
1. Run deactivate-inactive-users.ts
2. Find users with last_login < 3 days ago
3. Update is_active = false
4. Next time user tries to access → Blocked by middleware
5. User can reactivate by logging in again
```

---

## Issues & Recommendations

### ❌ Current Issues:
1. **No Automatic Deactivation**
   - Script exists but not scheduled
   - pg_cron not installed
   - Manual execution required

2. **No Notification to Inactive Users**
   - Users tidak diberi tahu sebelum di-nonaktifkan
   - Toast hanya muncul saat mereka coba akses

### ✅ Working Features:
1. **Reactivation on Login** - Works perfectly
2. **Middleware Protection** - Blocks inactive users effectively
3. **Auth Context Check** - Force logout inactive users
4. **Admin Dashboard** - Shows accurate active/inactive counts

### 🔧 Recommended Improvements:

#### Option 1: Use Supabase Edge Function (Recommended)
```typescript
// Create edge function: deactivate-inactive-users
// Schedule via Supabase Dashboard → Edge Functions → Schedule
// Run daily at midnight
```

#### Option 2: External Cron Job
```bash
# Setup GitHub Actions / Vercel Cron / Railway Cron
# Call API endpoint to trigger deactivation script
```

#### Option 3: Client-side Scheduled Function
```typescript
// Create API route: /api/cron/deactivate-users
// Protect with API key
// Use external cron service (cron-job.org, etc.)
```

---

## Testing Guide

### Test Inactive User:
1. Manually set `is_active = false` in database:
   ```sql
   UPDATE profiles SET is_active = false WHERE email = 'test@example.com';
   ```
2. Try to access dashboard
3. Should be redirected to login with error message

### Test Reactivation:
1. User with `is_active = false` logs in
2. `is_active` automatically set to `true`
3. User can access dashboard normally

### Test Deactivation Script:
1. Set `last_login` to 4 days ago:
   ```sql
   UPDATE profiles 
   SET last_login = NOW() - INTERVAL '4 days' 
   WHERE email = 'test@example.com';
   ```
2. Run script: `ts-node scripts/deactivate-inactive-users.ts`
3. Check `is_active` should be `false`

---

## Configuration

### Environment Variables Required:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For deactivation script
```

### Database Schema:
```sql
-- profiles table
last_login TIMESTAMP WITH TIME ZONE
is_active BOOLEAN DEFAULT TRUE
```

### Inactivity Threshold:
- **Current:** 3 days (72 hours)
- **Location:** `scripts/deactivate-inactive-users.ts`
- **Change:** Update `3 * 24 * 60 * 60 * 1000`

---

## Summary

| Feature | Status | Location |
|---------|--------|----------|
| Login Reactivation | ✅ Working | login-form.tsx |
| Middleware Check | ✅ Working | middleware.ts |
| Auth Context Check | ✅ Working | auth-context.tsx |
| Admin Dashboard Display | ✅ Working | admin-dashboard-content.tsx |
| Manual Deactivation | ✅ Available | scripts/deactivate-inactive-users.ts |
| Auto Deactivation | ❌ Not Setup | Need cron job |
| User Notification | ❌ Not Implemented | - |

**Next Steps:**
1. Setup automatic execution of deactivation script (Edge Function or external cron)
2. Add user notification before deactivation (email/notification)
3. Add admin interface to manually activate/deactivate users
