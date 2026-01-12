"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardPath, UserRole } from '@/lib/auth-utils';
import { Spinner } from '@/components/ui/spinner';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Don't redirect from here - let login-form handle redirect after successful login
    // This component only handles redirects for users who land on /login while already authenticated
    // (e.g., bookmark, direct URL access)
    if (!loading && user && profile && typeof window !== 'undefined') {
      // Check if this is a fresh login attempt (within last 5 seconds)
      const isPostLogin = sessionStorage.getItem('post-login');
      const loginTimestamp = sessionStorage.getItem('login-timestamp');
      const isRecentLogin = loginTimestamp && (Date.now() - parseInt(loginTimestamp)) < 5000;
      
      // Only redirect if NOT a recent login (to prevent double redirect)
      if (!isPostLogin && !isRecentLogin) {
        const redirectPath = getDashboardPath(profile.role as UserRole);
        // Use hard navigation to ensure cookies are sent to middleware
        window.location.href = redirectPath;
      } else if (isPostLogin || isRecentLogin) {
        // Clear the flags after detecting them
        sessionStorage.removeItem('post-login');
        sessionStorage.removeItem('login-timestamp');
      }
    }
  }, [user, profile, loading, router, mounted]);

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

  // Show loading if user exists but profile is still loading
  if (user && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
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
