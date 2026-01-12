'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardPath, UserRole } from '@/lib/auth-utils';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      if (user && profile) {
        // Redirect authenticated users to their dashboard
        // Use hard navigation to ensure cookies are sent to middleware
        const dashboardPath = getDashboardPath(profile.role as UserRole);
        window.location.href = dashboardPath;
      } else {
        // Redirect unauthenticated users to login
        window.location.href = '/login';
      }
    }
  }, [user, profile, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-12 w-12" />
    </div>
  );
}
