"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardPath, type UserRole } from '@/lib/auth-utils';
import { Spinner } from '@/components/ui/spinner';
import { LoginForm } from '@/components/login-form';
import { toast } from 'sonner';

function isUserRole(value: string): value is UserRole {
  return value === 'admin' || value === 'owner' || value === 'controller' || value === 'user';
}

export default function LoginPage() {
  const { user, profile, loading, profileStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const hasShownExpiredMessageRef = useRef(false);

  const sessionExpired = useMemo(() => searchParams.get('session_expired'), [searchParams]);

  useEffect(() => {
    // Set mounted in next tick to avoid setState in render
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle session expired message
  useEffect(() => {
    if (!mounted) return;
    if (hasShownExpiredMessageRef.current) return;
    if (sessionExpired !== 'true') return;

    hasShownExpiredMessageRef.current = true;
    toast.error('Session Anda telah expired. Silakan login kembali.', {
      duration: 5000,
    });
    // Clean up URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('session_expired');
    window.history.replaceState({}, '', newUrl.toString());
  }, [mounted, sessionExpired]);

  useEffect(() => {
    // Redirect users who are already authenticated and land here (bookmark/direct access)
    if (!loading && user && profile && mounted) {
      const safeRole: UserRole = isUserRole(profile.role) ? profile.role : 'user';
      const redirectPath = getDashboardPath(safeRole);
      router.replace(redirectPath);
    }
  }, [user, profile, loading, mounted, router]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }


  // If user exists but profile is still loading/idle, keep showing a loader.
  if (user && !profile && !loading && (profileStatus === 'loading' || profileStatus === 'idle')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // Show error if user exists but profile is null after loading
  if (user && !profile && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xl font-semibold mb-2">Profile tidak ditemukan</div>
          <div className="text-gray-500 mb-4">Akun Anda tidak memiliki data profile yang valid. Silakan hubungi admin atau logout lalu login kembali.</div>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
            onClick={async () => {
              window.location.href = '/login?forceLogout=1';
            }}
          >Logout</button>
        </div>
      </div>
    );
  }

  // Only show login form if not authenticated
  if (!user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    );
  }

  // If user and profile exist, redirect will happen
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-12 w-12" />
    </div>
  );
}
