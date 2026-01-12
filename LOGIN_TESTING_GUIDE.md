# 🧪 Login Flicker Fix - Testing Guide

## Overview
This guide helps verify that the login flicker issue has been resolved.

---

## Pre-Testing Checklist

### 1. Verify Code Changes
```bash
# Check LoginLayout has the fix
grep -n "if (user && !profile)" src/app/login/layout.tsx

# Expected output:
# Line ~45: if (user && !profile) {
```

### 2. Verify Server Running
```bash
npm run dev
# Should show:
# ✓ Ready in 667ms
# Local: http://localhost:3000
```

### 3. Verify No TypeScript Errors
```bash
npm run build
# Should show:
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
```

---

## Manual Test Procedures

### Test 1: Fresh Login Flow (Most Important)

**Purpose**: Verify smooth transition from login to dashboard

**Prerequisites**:
- Browser cache cleared (Ctrl+Shift+Del)
- DevTools open (F12)
- Network tab active

**Steps**:

1. **Navigate to login**
   - Open [http://localhost:3000](http://localhost:3000)
   - Should see spinner briefly (auth checking)
   - Then redirects to `/login`

2. **Observe login form**
   - Form visible with email/password inputs
   - No visible flicker

3. **Open DevTools Network Tab**
   - Ctrl+Shift+I → Network tab
   - Set filter to "Fetch/XHR"

4. **Enter credentials**
   - Email: demo@example.com (adjust if different)
   - Password: Test@123!
   - Click "Masuk"

5. **Watch the transition**
   - **What should happen**:
     - Form disappears immediately
     - Spinner shows briefly (loading profile)
     - Dashboard appears with content
     - **Total time**: ~1-2 seconds
     - **Flicker**: NONE ✅

   - **What should NOT happen**:
     - Form showing then disappearing
     - Multiple page reloads
     - Rapid switching between pages
     - Console errors

6. **Check Network Tab**
   - Should see requests in this order:
     ```
     1. POST (login mutation)
     2. GET /login (redirected)
     3. GET /dashboard (final)
     ```
   - Should NOT see alternating /login, /dashboard requests

**Expected Result**: ✅ Smooth, flicker-free transition

---

### Test 2: Unauthenticated Access (Root Path)

**Purpose**: Verify redirect from `/` to login

**Steps**:
1. Clear cookies (logout if needed)
   - DevTools → Application → Cookies → Delete all
2. Navigate to [http://localhost:3000](http://localhost:3000)
3. Observe: Should see spinner, then redirect to login
4. Verify: No flicker, smooth redirect

**Expected Result**: ✅ Clean redirect to login

---

### Test 3: Already Authenticated (Session Persistence)

**Purpose**: Verify redirect to dashboard for logged-in users

**Prerequisites**: 
- Already logged in from Test 1

**Steps**:
1. Refresh page (F5)
2. Should see spinner
3. Should redirect to dashboard
4. No form visible

**Expected Result**: ✅ Automatic dashboard redirect

---

### Test 4: Role-Based Routing

**Purpose**: Verify correct dashboard based on user role

**Prerequisites**:
- Know test user's role (admin, owner, controller, user)

**Steps**:

1. **Test Admin Login**
   - Login with admin account
   - Should redirect to `/admin/dashboard`
   - If non-admin tries `/admin/dashboard`:
     - Should redirect to `/dashboard`

2. **Test Regular User Login**
   - Login with user account
   - Should redirect to `/dashboard`

3. **Test Controller Login**
   - Login with controller account  
   - Should redirect to `/dashboard`

**Expected Result**: ✅ Correct routing per role

---

### Test 5: Error Handling

**Purpose**: Verify behavior with invalid credentials

**Steps**:
1. Navigate to login
2. Enter invalid credentials
   - Email: fake@example.com
   - Password: wrongpassword
3. Click "Masuk"
4. Observe: Should show error message
5. Verify: Form stays visible, no redirect

**Expected Result**: ✅ Error displayed, stays on form

---

### Test 6: Network Slowness Simulation

**Purpose**: Verify spinner shows during slow profile fetch

**Steps**:
1. Open DevTools (F12)
2. Network tab → throttle to "Slow 3G"
3. Login with valid credentials
4. Observe: Spinner should show longer (waiting for profile)
5. Should eventually load dashboard
6. No flicker at any point

**Expected Result**: ✅ Spinner throughout, no flicker

---

## Browser Console Verification

### Things to Check

1. **No Errors**
   ```
   Should see: 0 errors
   ```

2. **Auth Logs** (if debug enabled)
   ```
   Should see: "Profile loaded" or similar
   ```

3. **No Warnings About**
   ```
   ❌ "Missing dependency"
   ❌ "useEffect cleanup"
   ❌ "React.StrictMode warning"
   ```

### Console Commands (for advanced testing)

```javascript
// Check auth context state
// (If exported from auth-context)
console.log('Auth state:', {
  user: true,      // Should be user object or null
  profile: true,   // Should be profile object or null
  loading: true    // Should be boolean
});

// Simulate profile fetch delay
// (For testing spinner behavior)
setTimeout(() => {
  console.log('Simulated profile delay...');
}, 3000);
```

---

## Performance Verification

### Acceptable Metrics

| Metric | Target | Allow |
|--------|--------|-------|
| Redirect time | < 2s | < 3s |
| Profile fetch | < 1s | < 2s |
| First paint | < 1s | < 1.5s |
| Button click to redirect | < 500ms | < 1s |

### How to Measure

1. Open DevTools → Performance tab
2. Click "Record"
3. Click "Masuk" (login button)
4. Stop when dashboard shows
5. Check timeline for:
   - Auth API call time
   - Profile fetch time
   - Router.push execution
   - Render time

---

## Regression Testing

### After Each Code Change

Run these tests to ensure no new issues:

```bash
# 1. Build test
npm run build

# 2. Type check
npm run build

# 3. Quick manual test
# - Navigate to /
# - Login
# - Verify smooth redirect
# - No console errors
```

---

## Troubleshooting

### Problem: Still Seeing Flicker ❌

**Diagnostics**:
1. Check console for errors
2. Check Network tab:
   - Is profile fetch slow?
   - Are there multiple redirects?
3. Check code:
   - Is `if (user && !profile)` check present?
   - Is LoginForm using `useAuth`? (should NOT)

**Solution**:
- Verify the fix is properly applied
- Check commit hash
- Rebuild: `npm run build`
- Restart server: `npm run dev`
- Clear browser cache

### Problem: Stuck on Spinner ⏳

**Diagnostics**:
1. Check browser console for errors
2. Check terminal for server errors
3. Check network tab for failed requests
4. Check if test user profile exists in database

**Solution**:
- Verify profile exists for user
- Check database connection
- Restart server

### Problem: Redirect Loop 🔄

**Diagnostics**:
1. Check Network tab
2. Look for repeated POST requests
3. Check for competing redirects

**Solution**:
- Verify LoginForm doesn't have redirect logic
- Verify only ONE redirect in LoginLayout
- Check getDashboardPath() function
- Verify role values in database match code

### Problem: Profile Not Loading

**Diagnostics**:
1. Check Supabase connection
2. Check if profiles table exists
3. Check if user profile record exists
4. Check permissions in RLS policies

**Solution**:
- Verify profiles table has correct structure
- Verify RLS allows profile reads
- Create test profile if missing
- Check Supabase logs for errors

---

## Test Report Template

Use this to document your testing:

```markdown
## Login Flicker Fix - Test Report
Date: [DATE]
Tester: [NAME]
Server Version: [VERSION]

### Manual Tests
- [ ] Test 1: Fresh Login - PASS/FAIL
- [ ] Test 2: Root Redirect - PASS/FAIL
- [ ] Test 3: Session Persistence - PASS/FAIL
- [ ] Test 4: Role-Based Routing - PASS/FAIL
- [ ] Test 5: Error Handling - PASS/FAIL
- [ ] Test 6: Network Slowness - PASS/FAIL

### Observations
- Flicker visible: YES / NO / MINIMAL
- Redirect time: ___ seconds
- Errors in console: YES / NO
- Profile fetch time: ___ ms

### Additional Notes
[Any observations or issues]

### Verdict
✅ PASS - Fix is working properly
❌ FAIL - Issue persists, needs investigation
```

---

## Continuous Verification

After deploying the fix, continue monitoring:

1. **Weekly**:
   - Run one manual login test
   - Check server logs for auth errors
   - Monitor user feedback

2. **Monthly**:
   - Run full test suite
   - Check performance metrics
   - Verify no regressions

3. **Per Release**:
   - Run all 6 manual tests
   - Check console for errors
   - Verify no new issues introduced

---

## Related Documentation

- [FLICKER_DIAGNOSIS.md](FLICKER_DIAGNOSIS.md) - Technical explanation
- [LOGIN_REDIRECT_FIX.md](LOGIN_REDIRECT_FIX.md) - Implementation details
- [ROLE_LOGIN_CHECKLIST.md](ROLE_LOGIN_CHECKLIST.md) - Full role-based testing
- [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) - Auth system overview

---

**Status**: ✅ Ready for Testing
**Last Updated**: December 22, 2025
**Maintainer**: Development Team
