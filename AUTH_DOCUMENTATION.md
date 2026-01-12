# Authentication & Role-Based Access Control (RBAC) Documentation

## 📋 Overview

Sistem autentikasi ini menggunakan Supabase dengan role-based access control untuk mengelola akses pengguna berdasarkan peran mereka.

## 🔐 Roles & Permissions

| Role | Description | Permissions | Dashboard |
|------|-------------|-------------|-----------|
| **admin** | Administrator | Full access - read, write, delete, manage users & roles | `/admin/dashboard` |
| **owner** | Owner/Manager | Can manage own resources & view reports | `/dashboard` |
| **controller** | Controller | Can read and modify assigned resources | `/dashboard` |
| **user** | Regular User | Read-only access | `/dashboard` |

## 🏗️ Architecture

### Key Components

1. **AuthProvider** (`src/contexts/auth-context.tsx`)
   - Global auth state management
   - Session & user tracking
   - Profile fetching from database
   - Sign out functionality

2. **ProtectedRoute** (`src/components/auth/protected-route.tsx`)
   - Component-level route protection
   - Role-based access validation
   - Auto-redirect untuk unauthorized users
   - Displays loading spinner during auth check

3. **RouteGuard** (`src/components/auth/route-guard.tsx`)
   - Enhanced route protection
   - Handles both authenticated and non-authenticated routes

4. **LoginForm** (`src/components/login-form.tsx`)
   - Login UI with email & password
   - Error handling dengan user-friendly messages
   - Auto-redirect after successful login

5. **Auth Utils** (`src/lib/auth-utils.ts`)
   - Helper functions untuk role checking
   - Permission validation
   - Dashboard path routing

## 🔄 Authentication Flow

```
1. User visits "/" (main page)
   ↓
   → Redirects to "/login"

2. User enters credentials on "/login"
   ↓
   → Supabase validates email & password
   ↓
   → If valid: AuthContext updates dengan user & profile
   ↓
   → LoginForm auto-redirects ke dashboard sesuai role

3. User tries akses protected page
   ↓
   → ProtectedRoute checks authentication
   ↓
   → If not authenticated: redirect to "/login"
   ↓
   → If authenticated but wrong role: redirect ke dashboard sesuai role

4. User clicks logout
   ↓
   → signOut() di context
   ↓
   → Redirect ke "/login"
```

## 📁 Protected Routes

### User Dashboards
```
GET /dashboard
- Allowed Roles: owner, controller, user
- Protected By: ProtectedRoute allowedRoles={['owner', 'controller', 'user']}
```

### Admin Dashboard
```
GET /admin/dashboard
- Allowed Roles: admin only
- Protected By: ProtectedRoute allowedRoles={['admin']}
```

### Login Page
```
GET /login
- If already authenticated: Auto-redirect ke dashboard
- Layout: LoginLayout dengan auth check
```

## 🛠️ Usage Examples

### Wrap a page dengan role restriction

```tsx
import ProtectedRoute from '@/components/auth/protected-route';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>Admin Only Content</div>
    </ProtectedRoute>
  );
}
```

### Check user role di component

```tsx
import { useAuth } from '@/contexts/auth-context';
import { hasPermission, isAdmin } from '@/lib/auth-utils';

export default function MyComponent() {
  const { profile } = useAuth();
  
  if (isAdmin(profile?.role)) {
    return <div>Admin Panel</div>;
  }
  
  if (hasPermission(profile?.role, 'write')) {
    return <div>Can Edit</div>;
  }
  
  return <div>Read Only</div>;
}
```

### Get correct dashboard path

```tsx
import { getDashboardPath } from '@/lib/auth-utils';

const path = getDashboardPath(userRole);
// admin → '/admin/dashboard'
// owner → '/dashboard'
// controller → '/dashboard'
// user → '/dashboard'
```

## 🔑 Key Features

### ✅ Session Persistence
- Supabase automatically persists session dalam localStorage
- AuthContext checks session pada app load
- User tetap logged in setelah page refresh

### ✅ Auto-Redirect
- Main page (`/`) → Auto-redirect ke login jika belum auth
- Login page → Auto-redirect ke dashboard jika sudah auth
- Protected pages → Auto-redirect ke login jika belum auth

### ✅ Role-Based Routing
- User automatically dipandu ke dashboard sesuai role
- Admin dapat akses `/admin/dashboard`
- Non-admin users redirected ke `/dashboard`

### ✅ Error Handling
- Invalid credentials → "Email atau password salah"
- Unconfirmed email → "Email belum dikonfirmasi"
- Network errors → User-friendly error messages

### ✅ Loading States
- Spinner ditampilkan saat checking authentication
- Prevents flash of unauthorized content
- Smooth transitions antar pages

## 📊 Database Schema Requirements

Pastikan table `profiles` di Supabase memiliki struktur:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  full_name TEXT,
  division TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  access TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing Role-Based Login

Lihat [ROLE_LOGIN_CHECKLIST.md](../ROLE_LOGIN_CHECKLIST.md) untuk petunjuk testing dengan berbagai role.

### Test Cases
1. Login sebagai Admin
   - Expected: Redirect ke `/admin/dashboard`
   
2. Login sebagai Owner
   - Expected: Redirect ke `/dashboard`
   
3. Login sebagai Controller
   - Expected: Redirect ke `/dashboard`
   
4. Try akses `/admin/dashboard` sebagai non-admin
   - Expected: Redirect ke `/dashboard`
   
5. Try akses protected page tanpa login
   - Expected: Redirect ke `/login`
   
6. Refresh page saat logged in
   - Expected: Stay logged in (session persistence)

## 🔒 Security Considerations

1. **Never store sensitive data di localStorage** (handled by Supabase)
2. **Always validate roles di server-side** jika handling critical operations
3. **Use HTTPS only** di production
4. **Implement rate limiting** pada login endpoint
5. **Keep Supabase keys secure** di environment variables

## 🚀 Environment Variables

Pastikan `.env.local` memiliki:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 Troubleshooting

### User stuck di loading spinner
- Check browser console untuk errors
- Verify Supabase connection
- Clear localStorage dan refresh

### Auto-redirect not working
- Ensure AuthProvider wraps di root layout
- Check useAuth hook dependency array
- Verify profile data tersimpan di database

### Role mismatch
- Verify role di database table `profiles`
- Check case sensitivity (roles case-sensitive)
- Ensure profile fetched sebelum redirect

## 📚 Related Files

- Auth Context: [src/contexts/auth-context.tsx](src/contexts/auth-context.tsx)
- Protected Route: [src/components/auth/protected-route.tsx](src/components/auth/protected-route.tsx)
- Login Form: [src/components/login-form.tsx](src/components/login-form.tsx)
- Auth Utils: [src/lib/auth-utils.ts](src/lib/auth-utils.ts)
- Testing Guide: [ROLE_LOGIN_CHECKLIST.md](ROLE_LOGIN_CHECKLIST.md)
