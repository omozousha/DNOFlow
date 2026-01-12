# Security Implementation Documentation

## 🔐 Implementasi Keamanan Login

Dokumen ini menjelaskan implementasi keamanan yang telah diterapkan pada sistem login dan autentikasi.

**Tanggal Implementasi:** 1 Januari 2026

---

## ✅ Fitur Keamanan yang Telah Diimplementasikan

### 1. **Middleware Authentication & JWT Validation**
**File:** `src/middleware.ts`

**Fitur:**
- Validasi JWT token di setiap request
- Proteksi routes berdasarkan role (admin, owner, controller)
- Proteksi API endpoints
- Auto-refresh session jika expired
- Redirect ke login jika tidak terautentikasi
- Block user yang tidak aktif (is_active = false)

**Public Routes:**
- `/login`
- `/api/auth/callback`
- `/forgot-password`
- `/reset-password`

**Protected Routes:**
- `/admin/*` - Hanya untuk role admin
- `/owner/*` - Untuk role admin dan owner
- `/controller/*` - Untuk role admin, owner, dan controller

---

### 2. **Session Timeout & Auto-Logout (1 Jam Inaktif)**
**File:** `src/contexts/auth-context.tsx`

**Fitur:**
- **Session timeout:** 1 jam tanpa aktivitas → auto-logout
- **Warning:** Notifikasi 5 menit sebelum logout
- **Activity tracking:** Monitor mouse, keyboard, scroll, touch events
- **Auto-refresh session:** Setiap 30 menit untuk keep-alive
- **Smart throttling:** Hanya reset timer jika sudah 1 menit sejak aktivitas terakhir

**Timer Settings:**
```typescript
SESSION_TIMEOUT = 60 * 60 * 1000        // 1 jam
AUTO_REFRESH_INTERVAL = 30 * 60 * 1000  // 30 menit
WARNING_BEFORE_LOGOUT = 5 * 60 * 1000   // 5 menit
```

**Activity Events yang Dimonitor:**
- `mousedown` - Klik mouse
- `keydown` - Keyboard
- `scroll` - Scroll halaman
- `touchstart` - Touch untuk mobile
- `click` - Click events

---

### 3. **Rate Limiting Login Attempts**
**File:** `src/lib/rate-limiter.ts` & `src/components/login-form.tsx`

**Fitur:**
- **Max attempts:** 5 percobaan login per email
- **Lockout duration:** 15 menit setelah 5 kali gagal
- **Reset period:** 15 menit (counter reset otomatis)
- **Persistence:** Menggunakan localStorage
- **Visual feedback:** Counter attempts remaining
- **Countdown timer:** Tampilkan sisa waktu lockout

**Cara Kerja:**
1. Setiap login gagal → counter +1
2. Setelah 5 kali gagal → akun dikunci 15 menit
3. Login berhasil → counter direset
4. Setelah 15 menit → counter direset otomatis

**UI Feedback:**
- "X percobaan tersisa" setelah gagal login
- Alert lockout dengan countdown timer
- Disable form saat locked

---

### 4. **Password Reset Flow**
**Files:** 
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`

**Fitur:**
- Email-based password reset via Supabase Auth
- Link reset expired dalam 1 jam
- Validasi session sebelum reset
- Password minimum 8 karakter
- Konfirmasi password matching
- Auto-redirect ke login setelah berhasil

**Flow:**
1. User input email di `/forgot-password`
2. Supabase kirim email dengan link reset
3. User klik link → redirect ke `/reset-password`
4. Validasi session dari link
5. User input password baru + konfirmasi
6. Update password via Supabase Auth
7. Redirect ke login

---

### 5. **Secure Audit API**
**File:** `src/app/api/auth/login-audit/route.ts`

**Fitur:**
- API key authentication untuk audit endpoint
- Header validation: `x-audit-api-key`
- Log semua login attempts (success/failed)
- Graceful error handling
- Silent failure untuk tidak block login flow

**Environment Variable:**
```env
AUDIT_API_KEY=your-secure-key
NEXT_PUBLIC_AUDIT_API_KEY=your-secure-key
```

**Usage:**
```javascript
fetch('/api/auth/login-audit', {
  headers: {
    'x-audit-api-key': process.env.NEXT_PUBLIC_AUDIT_API_KEY
  },
  body: JSON.stringify({
    userId, email, success, message
  })
})
```

---

### 6. **Production-Safe Logging**
**Implementation:** Conditional console.log

**Pattern:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug] Sensitive data', data);
}
```

**Applied to:**
- `src/contexts/auth-context.tsx`
- `src/components/login-form.tsx`
- All authentication-related files

**Benefits:**
- No sensitive data logged in production
- Debug info available in development
- Better security posture

---

## 🔧 Configuration

### Environment Variables
**File:** `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Database
DATABASE_URL=your_db_url

# Audit API (CHANGE IN PRODUCTION!)
AUDIT_API_KEY=your-secure-key
NEXT_PUBLIC_AUDIT_API_KEY=your-secure-key

# Environment
NODE_ENV=development
```

**⚠️ IMPORTANT:** 
- **Never commit** `.env.local` to git
- Use `.env.example` as template
- Change `AUDIT_API_KEY` in production
- Rotate keys regularly

---

## 📊 Security Metrics

### Login Security
- ✅ JWT-based authentication
- ✅ Session management with cookies
- ✅ Rate limiting (5 attempts / 15 min)
- ✅ Auto-logout after 1 hour inactivity
- ✅ Auto-refresh session every 30 min
- ✅ Password reset with email verification
- ✅ Audit logging for all login attempts

### Route Protection
- ✅ Middleware-level authentication
- ✅ Role-based access control (RBAC)
- ✅ API endpoint protection
- ✅ Inactive user blocking

### Data Protection
- ✅ Password hashing (Supabase)
- ✅ Secure cookies (httpOnly, secure)
- ✅ No sensitive data in production logs
- ✅ API key authentication for internal APIs

---

## 🚀 Testing Checklist

### Manual Testing
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid (5x) → harus locked
- [ ] Wait lockout timer → harus bisa login lagi
- [ ] Biarkan inactive 1 jam → harus auto-logout
- [ ] Aktivitas user → timer harus reset
- [ ] Forgot password flow end-to-end
- [ ] Reset password dengan link expired
- [ ] Akses protected route tanpa login → redirect
- [ ] Akses admin route dengan role owner → redirect
- [ ] Inactive user login → harus blocked

### Automated Testing (TODO)
- [ ] Unit tests untuk RateLimiter
- [ ] Integration tests untuk auth flow
- [ ] E2E tests untuk login/logout
- [ ] Session timeout tests

---

## 🔄 Maintenance

### Regular Tasks
1. **Weekly:**
   - Review audit logs untuk suspicious activity
   - Monitor failed login attempts

2. **Monthly:**
   - Rotate API keys
   - Review and update security policies
   - Check for Supabase security advisories

3. **Quarterly:**
   - Penetration testing
   - Security audit
   - Update dependencies

### Monitoring
- Monitor login failure rates
- Alert on multiple lockouts from same IP
- Track session durations
- Monitor API error rates

---

## 📝 Future Enhancements

### Priority High
- [ ] Implement CAPTCHA after 3 failed attempts
- [ ] Add IP-based rate limiting (backend)
- [ ] Email notification for suspicious login
- [ ] Login history for users

### Priority Medium
- [ ] Two-Factor Authentication (2FA/MFA)
- [ ] Biometric authentication support
- [ ] OAuth providers (Google, GitHub)
- [ ] Session management dashboard

### Priority Low
- [ ] Passwordless authentication
- [ ] Device fingerprinting
- [ ] Geo-location based restrictions
- [ ] Advanced threat detection

---

## 🆘 Troubleshooting

### User Locked Out
**Problem:** User terkunci setelah 5 kali gagal login
**Solution:** 
1. Wait 15 menit untuk auto-unlock
2. Admin bisa clear localStorage di browser user
3. Or clear `login_rate_limit_<email>` di localStorage

### Session Expired Too Quickly
**Problem:** User logout padahal masih aktif
**Solution:**
1. Check browser console untuk errors
2. Verify activity events di AuthContext
3. Check if cookies are being set properly

### Forgot Password Email Not Received
**Problem:** Email reset tidak masuk
**Solution:**
1. Check spam folder
2. Verify Supabase email settings
3. Check email templates di Supabase dashboard
4. Verify redirect URL configuration

---

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated:** 1 Januari 2026  
**Maintained By:** Development Team
