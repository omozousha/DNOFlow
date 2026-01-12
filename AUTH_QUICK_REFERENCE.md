# Auth System Quick Reference

## 🔐 Hooks & Context

### useAuth() - Get current user & auth state
```tsx
import { useAuth } from '@/contexts/auth-context';

const { user, session, loading, profile, signOut } = useAuth();

// Properties:
// user: User | null - Supabase user object
// session: Session | null - Auth session
// loading: boolean - Loading state
// profile: ProfileData | null - User profile dari database
//   - id: string
//   - email: string  
//   - role: 'admin' | 'owner' | 'controller' | 'user'
//   - full_name?: string
//   - division?: string
//   - position?: string
//   - is_active: boolean
//   - access?: string
// signOut: () => Promise<void> - Logout user
```

## 🛡️ Protected Components

### ProtectedRoute - Wrap components yang butuh auth
```tsx
import ProtectedRoute from '@/components/auth/protected-route';

// Require authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Require specific roles
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute allowedRoles={['owner', 'admin']}>
  <ManagementPanel />
</ProtectedRoute>

// Custom redirect path
<ProtectedRoute 
  redirectTo="/unauthorized"
  allowedRoles={['admin']}
>
  <AdminOnly />
</ProtectedRoute>
```

## 🛠️ Utility Functions

### getDashboardPath() - Get correct dashboard URL
```tsx
import { getDashboardPath } from '@/lib/auth-utils';

const path = getDashboardPath(userRole);
// 'admin' → '/admin/dashboard'
// 'owner' → '/dashboard'
// 'controller' → '/dashboard'
// 'user' → '/dashboard'
```

### hasRole() - Check user role
```tsx
import { hasRole } from '@/lib/auth-utils';

if (hasRole(userRole, ['admin', 'owner'])) {
  // User is admin or owner
}
```

### hasPermission() - Check user permission
```tsx
import { hasPermission } from '@/lib/auth-utils';

if (hasPermission(userRole, 'write')) {
  // User can write
}

if (hasPermission(userRole, 'manage_users')) {
  // User can manage users (admin only)
}

// Available permissions:
// - read
// - write
// - delete
// - manage_users
// - manage_roles
// - view_reports
```

### isAdmin() & isOwnerOrAdmin() - Quick checks
```tsx
import { isAdmin, isOwnerOrAdmin } from '@/lib/auth-utils';

if (isAdmin(userRole)) {
  // User is admin
}

if (isOwnerOrAdmin(userRole)) {
  // User is owner or admin
}
```

## 📋 Roles & Permissions

| Role | Permissions |
|------|-------------|
| **admin** | read, write, delete, manage_users, manage_roles, view_reports |
| **owner** | read, write, view_reports |
| **controller** | read, write |
| **user** | read |

## 🔄 Common Patterns

### Display content based on role
```tsx
export function RoleBasedUI() {
  const { profile } = useAuth();
  
  return (
    <>
      {isAdmin(profile?.role) && <AdminPanel />}
      {hasPermission(profile?.role, 'write') && <EditButton />}
      {hasPermission(profile?.role, 'manage_users') && <UserManager />}
    </>
  );
}
```

### Protected page with role check
```tsx
export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <h1>Admin Dashboard</h1>
      {/* Content here */}
    </ProtectedRoute>
  );
}
```

### Logout button
```tsx
export function LogoutButton() {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
    // User automatically redirected ke /login
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

### Conditional navigation
```tsx
export function NavigationMenu() {
  const { profile } = useAuth();
  const items = [
    { label: 'Dashboard', href: '/dashboard' },
    ...(isAdmin(profile?.role) ? [
      { label: 'Admin Panel', href: '/admin/dashboard' }
    ] : [])
  ];
  
  return (
    <nav>
      {items.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

## 🔍 Debug Tips

### Check auth state
```tsx
const { user, profile, loading } = useAuth();
console.log({ user, profile, loading });
```

### Log role-based routing
```tsx
useEffect(() => {
  console.log('User role:', profile?.role);
  console.log('Redirect path:', getDashboardPath(profile?.role));
}, [profile]);
```

### Monitor auth state changes
```tsx
useEffect(() => {
  console.log('Auth state changed');
  if (user) console.log('User logged in:', user.email);
  else console.log('User logged out');
}, [user]);
```

## ⚠️ Common Mistakes

❌ **Don't** trust role dari user_metadata
```tsx
// ❌ Wrong
const role = user?.user_metadata?.role;
```

✅ **Do** get role dari profile (database)
```tsx
// ✅ Correct
const role = profile?.role;
```

---

❌ **Don't** put sensitive data in localStorage
```tsx
// ❌ Wrong
localStorage.setItem('userRole', role);
```

✅ **Do** rely on AuthContext
```tsx
// ✅ Correct
const { profile } = useAuth();
```

---

❌ **Don't** forget to wrap layout with AuthProvider
```tsx
// ❌ Wrong - auth won't work
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}
```

✅ **Do** wrap with AuthProvider
```tsx
// ✅ Correct
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## 📚 Documentation Files

- **AUTH_DOCUMENTATION.md** - Complete guide
- **AUTH_IMPLEMENTATION_CHECKLIST.md** - What was implemented
- **ROLE_LOGIN_CHECKLIST.md** - Testing guide
