'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { RateLimiter } from '@/lib/rate-limiter';
import { getDashboardPath } from '@/lib/auth-utils';
import { AlertCircle } from 'lucide-react';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [inactiveWarning, setInactiveWarning] = useState(false);
  const router = useRouter();

  // Check for inactive user error from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'inactive') {
      setInactiveWarning(true);
      setError('Akun Anda tidak aktif. Silakan hubungi administrator untuk mengaktifkan kembali akun Anda.');
      toast.error('Akun tidak aktif', {
        description: 'Silakan hubungi administrator untuk mengaktifkan kembali akun Anda.',
        duration: 6000,
      });
      // Clear the error param from URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Check rate limit on mount and email change
  useEffect(() => {
    if (!email) return;
    
    const { locked, remainingTime } = RateLimiter.isLocked(email);
    setIsLocked(locked);
    if (locked && remainingTime) {
      setLockTimeRemaining(remainingTime);
    }
  }, [email]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked || lockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validasi input
      if (!email || !password) {
        const errorMsg = 'Email dan password harus diisi';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Login] Email/password kosong', { email, password });
        }
        return;
      }

      // Check rate limit
      const { locked, remainingTime } = RateLimiter.isLocked(email);
      if (locked && remainingTime) {
        const errorMsg = `Terlalu banyak percobaan login. Coba lagi dalam ${RateLimiter.formatRemainingTime(remainingTime)}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLocked(true);
        setLockTimeRemaining(remainingTime);
        setLoading(false);
        return;
      }

      toast.loading('Signing in...', { id: 'login-toast' });

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (signInError) {
        // Record failed attempt
        const result = RateLimiter.recordAttempt(email);
        
        // Handle specific error messages
        let errorMsg = 'Gagal login';
        if (signInError.message.includes('Invalid login credentials')) {
          errorMsg = 'Email atau password salah';
          if (result.attemptsRemaining > 0) {
            errorMsg += `. ${result.attemptsRemaining} percobaan tersisa`;
          }
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMsg = 'Email belum dikonfirmasi. Silakan cek email Anda';
        } else {
          errorMsg = signInError.message;
        }
        
        // Check if now locked
        if (result.locked && result.remainingTime) {
          errorMsg = `Terlalu banyak percobaan login gagal. Akun dikunci selama ${RateLimiter.formatRemainingTime(result.remainingTime)}`;
          setIsLocked(true);
          setLockTimeRemaining(result.remainingTime);
        }
        
        setError(errorMsg);
        toast.error(errorMsg, { id: 'login-toast' });
        
        // Audit log for failed login
        fetch('/api/auth/login-audit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-audit-api-key': process.env.NEXT_PUBLIC_AUDIT_API_KEY || 'default-audit-key-change-me'
          },
          body: JSON.stringify({
            userId: null,
            email,
            success: false,
            message: errorMsg,
          }),
        }).catch(() => {}); // Silently fail audit log
        
        if (process.env.NODE_ENV === 'development') {
          console.error('[Login] Error saat login:', signInError, errorMsg);
        }
        setLoading(false);
        return;
      }
      
      // Reset rate limit on successful login
      RateLimiter.reset(email);
      
      // Audit log for successful login
      fetch('/api/auth/login-audit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-audit-api-key': process.env.NEXT_PUBLIC_AUDIT_API_KEY || 'default-audit-key-change-me'
        },
        body: JSON.stringify({
          userId: data.user?.id,
          email,
          success: true,
          message: 'Login successful',
        }),
      }).catch(() => {}); // Silently fail audit log
      
      // Update last_login timestamp in profiles
      if (data.user?.id) {
        await supabase.from('profiles').update({ 
          last_login: new Date().toISOString(), 
          is_active: true 
        }).eq('id', data.user.id);
      }
      
      toast.success('Login successful!', { id: 'login-toast' });
      
      // Fetch user profile to determine redirect path
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single();
      
      // Check if user is inactive
      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        const errorMsg = 'Akun Anda tidak aktif. Silakan hubungi administrator untuk mengaktifkan kembali akun Anda.';
        setError(errorMsg);
        setInactiveWarning(true);
        toast.error('Akun tidak aktif', {
          description: 'Silakan hubungi administrator untuk mengaktifkan kembali akun Anda.',
          duration: 6000,
        });
        setLoading(false);
        return;
      }
      
      // Use centralized getDashboardPath to ensure consistency across all roles
      const redirectPath = profile?.role 
        ? getDashboardPath(profile.role as 'admin' | 'owner' | 'controller' | 'user')
        : '/admin'; // fallback default
      
      // Mark as post-login BEFORE redirect to prevent race condition
      // Use multiple mechanisms to ensure it's captured
      try {
        sessionStorage.setItem('post-login', 'true');
        sessionStorage.setItem('login-timestamp', Date.now().toString());
      } catch (e) {
        console.warn('[Login] SessionStorage not available');
      }
      
      // Wait for AuthContext to finish processing the auth state change
      // This gives time for onAuthStateChange to fetch profile and setLoading(false)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Don't set loading to false before redirect - keep spinner visible
      // Use window.location for hard navigation to ensure middleware receives cookies
      window.location.href = redirectPath;
      
    } catch (err: any) {
      console.error('[Login] Exception:', err);
      const errorMsg = err.message || 'Terjadi kesalahan saat login';
      setError(errorMsg);
      toast.error(errorMsg, { id: 'login-toast' });
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveWarning && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                    Akun Tidak Aktif
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                    Akun Anda saat ini dalam status tidak aktif dan tidak dapat mengakses sistem.
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Untuk mengaktifkan kembali akun Anda, silakan hubungi administrator sistem atau IT support.
                  </p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isLocked}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isLocked}
                />
                <FieldDescription className="text-xs text-muted-foreground">
                  Lupa password? Hubungi administrator
                </FieldDescription>
              </Field>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <FieldDescription className="text-red-700 text-sm">
                    {error}
                  </FieldDescription>
                </div>
              )}
              {isLocked && lockTimeRemaining > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <FieldDescription className="text-yellow-800 text-sm">
                    Akun terkunci. Coba lagi dalam {RateLimiter.formatRemainingTime(lockTimeRemaining)}
                  </FieldDescription>
                </div>
              )}
              <Field>
                <Button type="submit" className="w-full" disabled={loading || isLocked}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Signing in...
                    </>
                  ) : isLocked ? (
                    'Akun Terkunci'
                  ) : (
                    'Login'
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
