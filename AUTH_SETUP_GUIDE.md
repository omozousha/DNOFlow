# 🔐 Authentication System - Quick Start Guide

Sistem autentikasi role-based yang sudah fully implemented dan siap digunakan!

## ✅ What's Been Done

- ✅ Main page redirect to login
- ✅ Login page protection (prevent auth users from visiting)
- ✅ Role-based dashboard routing
- ✅ Protected route components
- ✅ Auth utilities & helpers
- ✅ Comprehensive documentation

## 🚀 Quick Start

### 1. **Setup Environment**
```bash
# Make sure .env.local has:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 2. **Run Development Server**
```bash
npm run dev
```

### 3. **Test Authentication**
1. Visit http://localhost:3000
2. Auto-redirects to login page
3. Enter test credentials
4. Auto-redirects to dashboard based on role

## 📊 User Roles

| Role | Permissions | Dashboard |
|------|-------------|-----------|
| 👨‍💼 **Admin** | Full access | `/admin/dashboard` |
| 👤 **Owner** | Manage resources | `/dashboard` |
| 🎮 **Controller** | Edit assigned | `/dashboard` |
| 📖 **User** | Read only | `/dashboard` |

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    START (/)                         │
└──────────────────────┬────────────────────────────────┘
                       │
                   Loading...
                       │
                   ┌───┴────┐
                   │         │
              Logged In?  Not Logged
                   │         │
                   │    Redirect to /login
                   │         │
                   ├─────────┘
                   │
                ▼ ▼
         ┌──────────────────┐
         │   Get User Role  │
         └────────┬─────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
       Admin   Owner   Controller/User
        │         │         │
        ▼         ▼         ▼
    /admin/   /dashboard  /dashboard
    dashboard
```

## 💻 Code Examples

### Use Auth Hook
```tsx
import { useAuth } from '@/contexts/auth-context';

export function MyComponent() {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Welcome, {profile?.full_name}</p>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Protect a Page
```tsx
import ProtectedRoute from '@/components/auth/protected-route';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <h1>Admin Panel</h1>
    </ProtectedRoute>
  );
}
```

### Check Permissions
```tsx
import { hasPermission, isAdmin } from '@/lib/auth-utils';
import { useAuth } from '@/contexts/auth-context';

export function MyComponent() {
  const { profile } = useAuth();
  
  return (
    <>
      {isAdmin(profile?.role) && <AdminPanel />}
      {hasPermission(profile?.role, 'write') && <EditButton />}
    </>
  );
}
```

## 🧪 Test Cases

- [ ] Login as admin → redirects to `/admin/dashboard`
- [ ] Login as owner → redirects to `/dashboard`  
- [ ] Admin tries `/dashboard` → redirects to `/admin/dashboard`
- [ ] Non-admin tries `/admin/dashboard` → redirects to `/dashboard`
- [ ] Unauthenticated tries `/dashboard` → redirects to `/login`
- [ ] Logged in visits `/login` → redirects to dashboard
- [ ] Refresh page → stays logged in
- [ ] Click logout → redirects to `/login`

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| 📖 [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md) | Complete reference guide |
| ✅ [AUTH_IMPLEMENTATION_CHECKLIST.md](AUTH_IMPLEMENTATION_CHECKLIST.md) | What was implemented |
| ⚡ [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) | Code snippets & patterns |
| 🧪 [ROLE_LOGIN_CHECKLIST.md](ROLE_LOGIN_CHECKLIST.md) | Testing procedures |

## 🔧 Key Files

```
src/
├── contexts/
│   └── auth-context.tsx          ← Auth state management
├── components/
│   ├── login-form.tsx            ← Login UI
│   └── auth/
│       ├── protected-route.tsx    ← Page protection
│       └── route-guard.tsx        ← Route guarding
├── lib/
│   └── auth-utils.ts             ← Helper functions
└── app/
    ├── page.tsx                  ← Redirect to login
    ├── login/
    │   ├── layout.tsx            ← Login protection
    │   └── page.tsx              ← Login page
    ├── dashboard/
    │   └── page.tsx              ← User dashboard
    └── admin/dashboard/
        └── page.tsx              ← Admin dashboard
```

## 🔒 Security

- Uses Supabase for secure authentication
- Session stored securely (not in localStorage)
- Role validation on every protected route
- Profile data from database (not user metadata)

## 🆘 Need Help?

1. **Check the docs**: [AUTH_DOCUMENTATION.md](AUTH_DOCUMENTATION.md)
2. **View examples**: [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md)
3. **Debug logs**: Open browser console
4. **Test setup**: Follow [ROLE_LOGIN_CHECKLIST.md](ROLE_LOGIN_CHECKLIST.md)

## ❓ FAQs

**Q: How do I add a new role?**
A: Update your database schema, add to `UserRole` type in `auth-utils.ts`, and update role permissions mapping.

**Q: How do I check if user can edit?**
A: Use `hasPermission(profile?.role, 'write')` utility function.

**Q: What if user role doesn't match?**
A: User gets auto-redirected to their appropriate dashboard.

**Q: How do I logout?**
A: Call `signOut()` from useAuth hook.

**Q: Will user stay logged in after refresh?**
A: Yes! Supabase handles session persistence automatically.

---

🎉 **Your authentication system is ready to use!**

Start building with confidence. All routes are protected, all users are routed correctly based on their role!
