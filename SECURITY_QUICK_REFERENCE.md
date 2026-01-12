# 🔒 Security Quick Reference

## Session Timeout
- **Durasi:** 1 jam tanpa aktivitas
- **Warning:** 5 menit sebelum logout
- **Auto-refresh:** Setiap 30 menit

## Rate Limiting
- **Max attempts:** 5 kali per email
- **Lockout:** 15 menit
- **Auto-reset:** 15 menit

## Password Management
- ❌ **No self-service password reset** - User harus hubungi admin
- ✅ **Change password:** Via halaman `/account`
- ✅ **Admin resets:** Admin bisa reset password user via user management

## Environment Variables (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUDIT_API_KEY=
NEXT_PUBLIC_AUDIT_API_KEY=
```

## Protected Routes
- `/admin/*` → admin only
- `/owner/*` → admin, owner
- `/controller/*` → admin, owner, controller
- `/account` → admin, owner, controller (untuk change password)

## New Features
1. ✅ Middleware auth dengan JWT validation
2. ✅ Auto-logout setelah 1 jam inactive
3. ✅ Auto-refresh session setiap 30 menit
4. ✅ Rate limiting 5 attempts
5. ✅ Account page untuk change password
6. ✅ Secure audit API
7. ✅ Production-safe logging
8. ❌ Forgot password removed - user hubungi admin

## User Registration
- ✅ **Admin only** - Via `/admin/users`
- ❌ **No public registration** - Tidak ada self-registration
- ✅ **Role-based:** Admin assign role saat create user

## Testing
```bash
npm run dev  # Start dev server
```

Visit:
- `http://localhost:3000/login` - Test login
- `http://localhost:3000/account` - Change password (after login)
- Try 5 wrong passwords → should lock for 15 min
- Wait 1 hour inactive → should auto-logout

## Files Changed
- `src/middleware.ts` - Auth & route protection + /account
- `src/contexts/auth-context.tsx` - Session timeout & refresh
- `src/components/login-form.tsx` - Rate limiting + removed forgot password link
- `src/lib/rate-limiter.ts` - Rate limit utility
- `src/app/account/page.tsx` - NEW: Account & change password page
- `src/app/account/layout.tsx` - NEW: Account layout
- `src/config/sidebar.ts` - Added Account menu
- `src/app/api/auth/login-audit/route.ts` - Secure API
- `.env.local` - Added AUDIT_API_KEY
- `.env.example` - Template

## Removed Files
- ❌ `src/app/forgot-password/` - Removed (user hubungi admin)
- ❌ `src/app/reset-password/` - Removed (user hubungi admin)
- ❌ `src/app/admin/users/create/` - Removed (redundant)
- ❌ `src/app/api/admin/create-user/` - Removed (redundant)

## Documentation
📖 **Full docs:** `SECURITY_IMPLEMENTATION.md`
