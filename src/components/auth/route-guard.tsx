'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function RouteGuard({ children, requireAuth = true }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // ...existing code...
    if (loading || hasRedirected) return;
    // Jangan redirect sebelum user siap
    if (requireAuth && !user) {
      // ...existing code...
      setHasRedirected(true);
      router.push('/login');
      return;
    }
    // Jika user sudah login dan di halaman login, redirect ke dashboard
    if (!requireAuth && user && window.location.pathname === '/login') {
      setHasRedirected(true);
      const role = user.user_metadata?.role || 'user';
      let redirectPath;
      switch (role) {
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
        default:
          redirectPath = '/dashboard';
      }
      // ...existing code...
      router.push(redirectPath);
    }
  }, [user, loading, requireAuth, router, hasRedirected]);

  // Show loading spinner while checking authentication
  if (loading) {
    // ...existing code...
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // If authentication is required and user is not logged in, don't render children
  if (requireAuth && !user) {
    // ...existing code...
    return null;
  }

  // ...existing code...
  return <>{children}</>;
}
