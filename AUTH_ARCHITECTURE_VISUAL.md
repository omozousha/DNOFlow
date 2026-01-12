# 🏗️ Auth System Architecture Visualization

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                       UNAUTHENTICATED USER                      │
│                                                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Visit /  Visit /login  Try /dashboard
        │              │              │
        ▼              ▼              ▼
    Redirect       Display       Redirect
    to /login    Login Form      to /login
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
      Enter              Press "Forgot Password?"
    Credentials             │
        │                   ▼
        │            (Future Feature)
        │
        ▼
   Supabase Auth
   Validates Email
   & Password
        │
    ┌───┴────┐
    │         │
  Valid    Invalid
    │         │
    ▼         ▼
  ✅       ❌ Error Message
           "Email atau password salah"
           or
           "Email belum dikonfirmasi"
    │
    ▼
AuthContext Updates:
├─ user ✓
├─ session ✓
└─ profile ✓
    │
    ▼
Fetch from database:
├─ email
├─ role ⭐
├─ full_name
├─ division
├─ position
└─ is_active
    │
    ▼
LoginForm detects
profile update
    │
    ▼
Get redirect path
getDashboardPath(role)
    │
    ├─ admin → /admin/dashboard
    ├─ owner → /dashboard
    ├─ controller → /dashboard
    └─ user → /dashboard
    │
    ▼
Router.push(path)
    │
    ┌───┬───────┬──────────┐
    │   │       │          │
    ▼   ▼       ▼          ▼

┌──────────────────────────────────────────────┐
│                                              │
│          AUTHENTICATED USER                  │
│                                              │
│  Now has access to protected routes based   │
│  on role with proper dashboard              │
│                                              │
└──────────────────────────────────────────────┘


    ┌─────────────────────────────────────┐
    │   AUTHENTICATED + LOGGED IN STATE    │
    └──────────┬──────────────────────────┘
               │
     ┌─────────┼────────────┬──────────────┐
     │         │            │              │
   /login    /dashboard  /admin/       Try unauthorized
    Page      (OK)        dashboard      route (role X)
     │         │            │              │
     ▼         ▼            ▼              ▼
  Redirect   Display    Display        Check role
  to /       Dashboard  Admin Panel     in ProtectedRoute
  dashboard                             │
                                 ┌──────┘
                                 │
                         ┌───────┴────────┐
                         │                │
                      Role OK?         Role X
                         │                │
                         ▼                ▼
                      Display        Redirect to
                      Content        correct dashboard
                         │                │
                         │    ┌───────────┘
                         │    │
                         ▼    ▼
                    (User sees correct content)
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────┐
│           Root Layout                               │
│   ┌────────────────────────────────────────────┐   │
│   │   AuthProvider (Global Auth State)         │   │
│   │                                            │   │
│   │  Watches session changes                  │   │
│   │  Fetches user profile                     │   │
│   │  Provides useAuth() hook                  │   │
│   │                                            │   │
│   │  State:                                    │   │
│   │  ├─ user (Supabase user)                  │   │
│   │  ├─ session (Auth session)                │   │
│   │  ├─ profile (DB profile with role) ⭐    │   │
│   │  ├─ loading (boolean)                     │   │
│   │  └─ signOut (function)                    │   │
│   └────────────────────────────────────────────┘   │
│              │                                      │
│              │ provides                            │
│              ▼                                      │
│   ┌────────────────────────────────────────────┐   │
│   │   App Routes                               │   │
│   │                                            │   │
│   │  ┌─────────────────────────────────┐      │   │
│   │  │  /                              │      │   │
│   │  │  ├─ useAuth() → check loading   │      │   │
│   │  │  └─ redirect to /login          │      │   │
│   │  └─────────────────────────────────┘      │   │
│   │                                            │   │
│   │  ┌─────────────────────────────────┐      │   │
│   │  │  /login (Layout)                │      │   │
│   │  │  ├─ useAuth() → check user      │      │   │
│   │  │  ├─ if logged in: redirect      │      │   │
│   │  │  │  getDashboardPath(role)      │      │   │
│   │  │  └─ else: show LoginForm        │      │   │
│   │  │                                 │      │   │
│   │  │  ┌──────────────────────────┐   │      │   │
│   │  │  │  LoginForm               │   │      │   │
│   │  │  │  ├─ Email input          │   │      │   │
│   │  │  │  ├─ Password input       │   │      │   │
│   │  │  │  ├─ useAuth() for profile│   │      │   │
│   │  │  │  │  redirect             │   │      │   │
│   │  │  │  └─ Error display        │   │      │   │
│   │  │  └──────────────────────────┘   │      │   │
│   │  └─────────────────────────────────┘      │   │
│   │                                            │   │
│   │  ┌─────────────────────────────────┐      │   │
│   │  │  /dashboard                     │      │   │
│   │  │  ├─ ProtectedRoute              │      │   │
│   │  │  │  allowedRoles=              │      │   │
│   │  │  │  ['owner','controller',    │      │   │
│   │  │  │   'user']                   │      │   │
│   │  │  │  ├─ useAuth() check auth   │      │   │
│   │  │  │  ├─ useAuth() check role   │      │   │
│   │  │  │  └─ if OK: render content   │      │   │
│   │  │  └─ useAuth() for profile data │      │   │
│   │  └─────────────────────────────────┘      │   │
│   │                                            │   │
│   │  ┌─────────────────────────────────┐      │   │
│   │  │  /admin/dashboard               │      │   │
│   │  │  ├─ ProtectedRoute              │      │   │
│   │  │  │  allowedRoles=['admin']      │      │   │
│   │  │  │  ├─ useAuth() check auth   │      │   │
│   │  │  │  ├─ check role === 'admin' │      │   │
│   │  │  │  └─ if OK: render content   │      │   │
│   │  │  └─ useAuth() for profile data │      │   │
│   │  └─────────────────────────────────┘      │   │
│   │                                            │   │
│   └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Supabase Database
│
├─ auth.users table
│  ├─ id
│  ├─ email
│  └─ password (hashed)
│
└─ public.profiles table
   ├─ id (FK to auth.users.id) ⭐
   ├─ email
   ├─ role ← This determines access! 🔐
   ├─ full_name
   ├─ division
   ├─ position
   ├─ is_active
   └─ access

        │
        │ Supabase Auth
        │ signInWithPassword()
        │
        ▼
AuthContext
│
├─ Listens to auth state changes
├─ onAuthStateChange()
│
└─ When user logs in:
   │
   ├─ Set user from session
   │
   ├─ Fetch profile from DB
   │   └─ SELECT * FROM profiles WHERE id = user.id
   │
   └─ Store in context
      │
      ├─ user ✓
      ├─ session ✓
      └─ profile { ..., role } ⭐
             │
             ▼
        Available to all components via useAuth()
             │
             ├─ LoginForm redirects based on role
             ├─ ProtectedRoute checks role
             ├─ Dashboard shows role-specific content
             └─ Components use getDashboardPath(role)
```

## Role Routing Decision Tree

```
User logs in
    │
    ▼
Fetch profile.role
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
role === 'admin'?                    role === other
    │                                     │
   YES                                   NO
    │                                     │
    ▼                                     ▼
Redirect to                          Redirect to
/admin/dashboard                     /dashboard
    │                                     │
    ▼                                     ▼
├─ Full system access            ├─ Limited access
├─ User management               ├─ Own resources
├─ Role management               ├─ View reports
├─ All reports                   └─ (Depends on role)
└─ System settings
```

## Permission Matrix

```
                read  write  delete  manage_  manage_  view_
                                    users    roles    reports
┌────────────────────────────────────────────────────────────┐
│ admin      │  ✅   ✅    ✅     ✅      ✅       ✅      │
│ owner      │  ✅   ✅    ❌     ❌      ❌       ✅      │
│ controller │  ✅   ✅    ❌     ❌      ❌       ❌      │
│ user       │  ✅   ❌    ❌     ❌      ❌       ❌      │
└────────────────────────────────────────────────────────────┘
```

## Session Flow

```
Page Load
    │
    ▼
AuthProvider initializes
    │
    ├─ getSession() from Supabase
    │  │
    │  ├─ Session exists?
    │  │
    │  ├─ YES → Set user & session
    │  │
    │  └─ NO → user = null
    │
    ├─ If user exists: fetchProfile(userId)
    │  │
    │  └─ Get profile from database
    │
    └─ Set loading = false
        │
        ▼
Components render
    │
    ├─ useAuth() returns state
    ├─ ProtectedRoute checks auth
    ├─ LoginForm auto-redirects
    └─ Dashboard displays content
        │
        ▼
Supabase listens to auth changes
(user logs out, session expires, etc)
        │
        ▼
onAuthStateChange triggers
        │
        ├─ Update user
        ├─ Update session
        ├─ Refetch or clear profile
        │
        └─ Components re-render
            with new auth state
```

## Error Handling Flow

```
User enters credentials
    │
    ▼
signInWithPassword()
    │
    ├────────────────────────────┐
    │                            │
    ▼                            ▼
Success                      Error
    │                            │
    │                    ┌───────┴────────┐
    │                    │                │
    ▼                    ▼                ▼
AuthContext       Check error        Network
updates           message             Error
    │              │                  │
    ▼              ├─ Invalid         ▼
User redirects    │  credentials    Show error
based on role     │  → "Email atau   message
    │             │    password
    │             │    salah"
    │             │
    │             ├─ Email not
    │             │  confirmed
    │             │  → "Email
    │             │    belum
    │             │    dikonfirmasi"
    │             │
    │             └─ Other error
    │                → Generic
    │                  message
    │
    ▼
User stays on
/login page
```

---

**Key Takeaway**: Role is the centerpiece! 🔑
- It determines dashboard access
- It controls permissions
- It guides routing decisions
- It's stored securely in database
