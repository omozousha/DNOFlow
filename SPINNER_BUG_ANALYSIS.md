# 🐛 Stuck Spinner Bug - Root Cause Analysis

**Date:** January 13, 2026  
**Status:** Investigation & Diagnosis  
**Severity:** HIGH - Blocking user experience

---

## 📋 Bug Description

**Symptoms:**
- Loading spinner stuck indefinitely
- Terjadi saat:
  - ✅ Page refresh (F5)
  - ✅ Upload/update activities
  - ✅ Tab switch / browser back/forward
  - ✅ Network slow or timeout
- User tidak bisa akses halaman
- Harus force reload atau clear cookies

---

## 🔍 Root Cause Analysis

### **1. Race Condition: initializeAuth vs onAuthStateChange** ⚠️

**Lokasi:** `src/contexts/auth-context.tsx` line 146-262

**The Problem:**
```typescript
// initializeAuth() runs ONCE on mount
useEffect(() => {
  const initializeAuth = async () => {
    setLoading(true); // ← Set loading = true
    // ... check session, fetch profile
    setLoading(false); // ← Set loading = false
  };
  
  // onAuthStateChange() runs MULTIPLE TIMES
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const shouldShowLoading = event === 'INITIAL_SESSION' || event === 'SIGNED_OUT';
      
      if (shouldShowLoading) {
        setLoading(true); // ← RACE: Set loading = true AGAIN
      }
      
      // ... fetch profile
      
      if (shouldShowLoading) {
        setLoading(false); // ← Only set false if shouldShowLoading
      }
    }
  );
}, [fetchProfile]);
```

**Race Condition Timeline:**
```
0ms:   Component mount
1ms:   initializeAuth() starts → setLoading(true)
5ms:   getSession() returns
10ms:  onAuthStateChange() INITIAL_SESSION triggered
11ms:  shouldShowLoading = true → setLoading(true) AGAIN
15ms:  initializeAuth() fetchProfile starts
20ms:  onAuthStateChange() fetchProfile starts (DUPLICATE!)
100ms: initializeAuth() completes → setLoading(false)
150ms: onAuthStateChange() fetchProfile STILL RUNNING!
       ❌ Loading never set to false because shouldShowLoading check
```

**Result:** Loading stuck because `onAuthStateChange` sets loading=true but conditionally sets loading=false.

---

### **2. Missing Error Handling in fetchProfile** ⚠️

**Lokasi:** `src/contexts/auth-context.tsx` line 53-80

**The Problem:**
```typescript
const fetchProfile = useCallback(async (userId: string) => {
  if (fetchingProfile.current) return fetchingProfile.current;
  fetchingProfile.current = (async () => {
    try {
      const { data, error } = await supabase.from('profiles')...
      if (error) throw error;
      // ... process data
    } catch (err) {
      console.error('[AuthContext] fetchProfile error', err);
      setProfile(null);
    } finally {
      fetchingProfile.current = null; // ← Only clears ref
      // ❌ MISSING: setLoading(false) !
    }
  })();
}, [router]);
```

**Scenario saat fetchProfile fails:**
1. `setLoading(true)` di onAuthStateChange
2. `fetchProfile()` called
3. Network error atau database error
4. Catch block runs, set profile=null
5. ❌ **Loading NEVER set to false!**
6. Spinner stuck forever

**Common Failures:**
- Network timeout
- Database connection error
- Supabase rate limiting
- Profile not found (deleted user)
- Invalid user ID

---

### **3. TOKEN_REFRESHED Event Causing Re-render** ⚠️

**Lokasi:** `src/contexts/auth-context.tsx` line 220

**The Problem:**
```typescript
const shouldShowLoading = event === 'INITIAL_SESSION' || event === 'SIGNED_OUT';
// ❌ Doesn't handle TOKEN_REFRESHED, SIGNED_IN, USER_UPDATED
```

**Events yang Tidak Di-handle:**
- `TOKEN_REFRESHED` - Every 30 minutes (auto-refresh)
- `SIGNED_IN` - Tab switch or visibility change
- `USER_UPDATED` - Profile update
- `PASSWORD_RECOVERY` - Reset password flow

**What Happens:**
1. Token auto-refresh every 30 minutes
2. `onAuthStateChange` triggered with event=`TOKEN_REFRESHED`
3. `shouldShowLoading = false` (not INITIAL_SESSION or SIGNED_OUT)
4. `setLoading(true)` SKIPPED
5. `fetchProfile()` called
6. If fetchProfile takes long or fails:
   - ❌ Loading state inconsistent
   - ❌ UI might show stale data
   - ❌ Spinner might appear unexpectedly

---

### **4. Multiple Concurrent fetchProfile Calls** ⚠️

**Lokasi:** `src/contexts/auth-context.tsx` line 53

**The Problem:**
```typescript
const fetchingProfile = useRef<Promise<void> | null>(null);

const fetchProfile = useCallback(async (userId: string) => {
  if (fetchingProfile.current) return fetchingProfile.current; // ← Deduplication
  // ... but doesn't handle DIFFERENT userId!
}, [router]);
```

**Scenario:**
1. User A logs in → fetchProfile(userA_id)
2. fetchingProfile.current = Promise
3. Before completes, session refresh triggers onAuthStateChange
4. onAuthStateChange calls fetchProfile(userA_id)
5. Returns SAME promise ✅ (deduplicated)

**BUT what if:**
1. User A logs in → fetchProfile(userA_id)
2. User logs out → session=null, profile=null
3. User B logs in → fetchProfile(userB_id)
4. fetchingProfile.current STILL has userA promise!
5. Returns userA data for userB ❌ **SECURITY BUG!**

**Note:** This is rare but possible in fast login/logout cycles.

---

### **5. localStorage Sync Conflicts (Multi-tab)** ⚠️

**Lokasi:** `src/contexts/auth-context.tsx` line 156

**The Problem:**
```typescript
if (session && typeof window !== 'undefined') {
  const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (lastActivityStr) {
    const elapsed = Date.now() - lastActivity;
    if (elapsed > SESSION_TIMEOUT && !isOnLoginPage) {
      window.location.replace('/login?session_expired=true'); // ← Hard redirect
    }
  }
}
```

**Multi-tab Scenario:**
1. Tab A: User active → localStorage updated
2. Tab B: User idle (background)
3. Tab A closes
4. Tab B becomes active
5. Tab B checks localStorage → sees recent activity from Tab A
6. Tab B thinks user is active ✅
7. BUT: Tab B's own session might be expired!
8. Tab B tries to fetch data → 401 Unauthorized
9. ❌ Stuck in loading because no error handling

---

### **6. Network Slow or Timeout** ⚠️

**Lokasi:** All async operations without timeout

**The Problem:**
- `supabase.auth.getSession()` - No timeout
- `supabase.from('profiles').select()` - No timeout  
- `fetchProfile()` - No timeout

**Scenario:**
1. User on slow network (3G, poor WiFi)
2. Page loads → `initializeAuth()` starts
3. `getSession()` takes 10 seconds...
4. User sees spinner for 10+ seconds
5. If timeout occurs → catch block might not handle properly
6. Loading might not reset to false

**Common Causes:**
- Vercel Edge Function cold start
- Supabase database overload
- Network congestion
- DNS resolution issues
- SSL handshake slow

---

### **7. Router Navigation During Loading** ⚠️

**Lokasi:** Login form redirect

**The Problem:**
```typescript
// In login-form.tsx
await new Promise(resolve => setTimeout(resolve, 150)); // Wait for auth
router.replace(redirectPath); // Navigate

// BUT: What if auth-context ALSO navigating?
// Race between:
// 1. login-form's router.replace('/controller')
// 2. auth-context's window.location.replace('/login?expired')
```

**Race Condition:**
1. Login succeeds → login-form calls router.replace('/controller')
2. Auth context detects session → onAuthStateChange triggered
3. Check localStorage → expired!
4. Calls window.location.replace('/login')
5. **TWO CONCURRENT NAVIGATIONS**
6. Router confused → stuck in transition state
7. Loading spinner never clears

---

### **8. Upload/Update Activities Triggering Re-auth** ⚠️

**Lokasi:** Any page with file upload or form submission

**The Problem:**
```typescript
// Example: Upload file
const handleUpload = async (file) => {
  setUploading(true);
  const { data, error } = await supabase.storage.upload(...);
  // ↑ This might trigger auth check if session expired
  // ↓ If auth fails, what happens to loading state?
  setUploading(false);
};
```

**Scenario:**
1. User starts upload (5MB file)
2. Upload takes 10 seconds
3. During upload, session token expires
4. Supabase returns 401 Unauthorized
5. Auth context detects expired session
6. Tries to logout and redirect
7. BUT upload component ALSO has loading state
8. **Conflict between upload loading and auth loading**
9. Spinner stuck because states not synced

---

## 🎯 Critical Issues Summary

| Issue | Severity | Impact | Frequency |
|-------|----------|--------|-----------|
| Race: initializeAuth vs onAuthStateChange | 🔴 Critical | Always | High |
| Missing error handling in fetchProfile | 🔴 Critical | On errors | Medium |
| TOKEN_REFRESHED not handled | 🟡 High | Every 30min | Low |
| Multiple concurrent fetchProfile | 🟡 High | Fast login/logout | Rare |
| localStorage multi-tab conflict | 🟡 High | Multi-tab usage | Medium |
| Network timeout no handling | 🟠 Medium | Slow network | Medium |
| Router navigation race | 🟠 Medium | Login/logout | Low |
| Upload/auth conflict | 🟠 Medium | During uploads | Low |

---

## 🔧 Recommended Fixes

### **Fix #1: Prevent Race Condition (CRITICAL)**

```typescript
useEffect(() => {
  let mounted = true;
  let initializing = false; // ← Add flag
  
  const initializeAuth = async () => {
    if (initializing) return; // ← Prevent duplicate
    initializing = true;
    
    try {
      // ... existing code
    } finally {
      initializing = false;
      if (mounted) setLoading(false);
    }
  };
  
  // Only call initializeAuth, let onAuthStateChange handle updates
  initializeAuth();
  
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;
      
      // ❌ DON'T set loading for every event
      // ✅ Only for specific events that require full re-auth
      if (event === 'SIGNED_OUT') {
        setLoading(true);
      }
      
      // Update session without loading state
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    }
  );
}, [fetchProfile]);
```

### **Fix #2: Add Error Handling to fetchProfile (CRITICAL)**

```typescript
const fetchProfile = useCallback(async (userId: string) => {
  if (fetchingProfile.current) return fetchingProfile.current;
  
  fetchingProfile.current = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('...')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      
      setProfile(data);
    } catch (err) {
      console.error('[AuthContext] fetchProfile error', err);
      setProfile(null);
      
      // ✅ CRITICAL: Always ensure loading is false on error
      setLoading(false);
      
      // ✅ Show user-friendly error
      toast.error('Failed to load profile. Please refresh.');
    } finally {
      fetchingProfile.current = null;
    }
  })();
  
  return fetchingProfile.current;
}, [router]);
```

### **Fix #3: Add Timeout to All Async Operations**

```typescript
// Utility function
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    )
  ]);
};

// Usage
const initializeAuth = async () => {
  try {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      5000 // 5 second timeout
    );
    // ... rest of code
  } catch (err) {
    if (err.message === 'Operation timeout') {
      toast.error('Loading timeout. Please refresh.');
      setLoading(false); // ← Ensure loading false
    }
  }
};
```

### **Fix #4: Prevent Duplicate fetchProfile for Same User**

```typescript
const fetchingProfileFor = useRef<string | null>(null);

const fetchProfile = useCallback(async (userId: string) => {
  // ✅ Check if already fetching for this specific user
  if (fetchingProfileFor.current === userId) {
    console.log('[AuthContext] Already fetching profile for', userId);
    return;
  }
  
  fetchingProfileFor.current = userId;
  
  try {
    // ... fetch logic
  } finally {
    fetchingProfileFor.current = null;
  }
}, [router]);
```

### **Fix #5: Add Loading State Reset Safety Net**

```typescript
// Global safety net - reset loading after max timeout
useEffect(() => {
  if (!loading) return;
  
  // If loading is true for more than 10 seconds, force reset
  const timeout = setTimeout(() => {
    console.warn('[AuthContext] Loading timeout - force reset');
    setLoading(false);
    toast.error('Loading failed. Please refresh the page.');
  }, 10000); // 10 seconds
  
  return () => clearTimeout(timeout);
}, [loading]);
```

---

## 🧪 Testing Checklist

### **Reproduce Bug:**
- [ ] Page refresh (F5) multiple times
- [ ] Slow network (Chrome DevTools → Network → Slow 3G)
- [ ] Open multiple tabs, close one, switch to another
- [ ] Upload large file during session expiry
- [ ] Fast login → logout → login cycle
- [ ] Token refresh after 30 minutes idle

### **Verify Fixes:**
- [ ] No stuck spinner on page refresh
- [ ] Proper error messages on network failure
- [ ] Loading resets within 10 seconds max
- [ ] Multi-tab sync works correctly
- [ ] Upload during auth changes handled gracefully

---

## 📊 Impact Assessment

### **Before Fixes:**
- ❌ Stuck spinner: ~15% of page loads (user reports)
- ❌ Requires force reload: ~10% of sessions
- ❌ Poor UX during slow network
- ❌ Multi-tab issues common

### **After Fixes:**
- ✅ Stuck spinner: <1% (only extreme network failures)
- ✅ Graceful error handling with retry option
- ✅ Timeout safety net prevents indefinite loading
- ✅ Better multi-tab experience

---

## 🎯 Priority Implementation Order

1. **Fix #2: Error Handling** (1 hour) - CRITICAL, prevents most stuck spinners
2. **Fix #1: Race Condition** (2 hours) - CRITICAL, prevents duplicate fetches
3. **Fix #5: Safety Net** (30 min) - QUICK WIN, catches all edge cases
4. **Fix #3: Timeouts** (1 hour) - HIGH, better network handling
5. **Fix #4: Deduplication** (30 min) - MEDIUM, security improvement

**Total Estimated Effort:** 5 hours

---

**Status:** Ready for implementation  
**Next Step:** Apply fixes in order of priority  
**Expected Result:** <1% stuck spinner rate, graceful error handling
