# Role-Based Login Test Checklist

## Environment
- Project: dnoflow (efxyhgmnrplittfahgzu)
- Supabase URL & Anon Key configured in .env.local
- Ensure AuthProvider is wrapped in root layout (done)

## Prerequisite: Users & Profiles
Run these inserts once (via Supabase SQL Editor or MCP):
```sql
-- Create 3 test users (emails/passwords are placeholders; replace with real ones)
-- Then ensure profiles exist for each user with correct role

-- Example: set role for existing user (run per user)
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
UPDATE public.profiles SET role = 'owner' WHERE email = 'owner@example.com';
UPDATE public.profiles SET role = 'controller' WHERE email = 'controller@example.com';
```

## Test Cases

### 1. Admin Login
- **Email**: `admin@example.com` (or any user with profiles.role = 'admin')
- **Expected behavior**:
  - Login succeeds
  - Redirect to `/admin/dashboard` (or fallback `/dashboard` if route missing)
  - Sidebar shows all items: Dashboard, Projects, Users, Reports, Settings
  - Dashboard page shows “Admin Panel” section
  - ProtectedRoute with `allowedRoles={['admin']}` passes

### 2. Owner Login
- **Email**: `owner@example.com` (profiles.role = 'owner')
- **Expected behavior**:
  - Login succeeds
  - Redirect to `/dashboard`
  - Sidebar shows: Dashboard, Projects, Reports (no Users, no Settings)
  - Dashboard page shows owner-specific sections but not Admin Panel
  - ProtectedRoute with `allowedRoles={['owner']}` passes

### 3. Controller Login
- **Email**: `controller@example.com` (profiles.role = 'controller')
- **Expected behavior**:
  - Login succeeds
  - Redirect to `/dashboard`
  - Sidebar shows: Dashboard, Projects (no Users, Reports, Settings)
  - Dashboard page shows controller-specific UI
  - ProtectedRoute with `allowedRoles={['controller']}` passes

### 4. Invalid/No Role
- Create a user with no profile or profiles.role = null/invalid
- **Expected behavior**:
  - Login succeeds
  - Treated as `'user'` (fallback)
  - Sidebar filtered to items allowing `'user'` (currently none)
  - ProtectedRoute with `allowedRoles` rejects unless `'user'` is allowed

### 5. Role Guard Tests
- Create a test page wrapped with `<ProtectedRoute allowedRoles={['admin', 'owner']}>`
- Verify:
  - Admin can access
  - Owner can access
  - Controller cannot (redirects to `/dashboard`)

## Debugging Tips
- If role not detected: check browser console for `Failed to fetch profile` errors
- Verify RLS policies: `Users can read their own profile` must exist
- Verify trigger `handle_new_auth_user` runs on signup (creates profiles row)
- In Supabase SQL Editor, manually verify:
  ```sql
  SELECT id, email, role FROM public.profiles WHERE email = 'your-test-email@example.com';
  ```

## Automated Checks (Optional)
- Add unit test for `useAuth` returning correct role
- Add E2E test for login redirects per role
- Add RLS policy test: user can SELECT own profile but not others

## After Test
- Clean up test users or change roles back
- Document any missing routes (e.g., `/admin/dashboard`) if needed
