'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardPath } from '@/lib/auth-utils';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // ...existing code...
    if (loading || hasRedirected) return;

    // Jangan redirect sebelum profile siap
    if (!user) {
      // ...existing code...
      setHasRedirected(true);
      router.push(redirectTo);
      return;
    }

    // Jika ada batasan role, tunggu profile siap
    if (allowedRoles.length > 0) {
      if (!profile) {
        // ...existing code...
        return;
      }
      const userRole = profile.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        setHasRedirected(true);
        const redirectPath = getDashboardPath(userRole as any);
        // ...existing code...
        router.push(redirectPath);
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router, hasRedirected]);

  // Show loading spinner saat checking auth, menunggu profile, atau redirecting
  if (loading || (user && allowedRoles.length > 0 && !profile)) {
    // Jika user sudah login tapi profile null setelah loading selesai, tampilkan error
    if (user && !loading && !profile) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="text-center">
            <div className="text-xl font-semibold mb-2">Profile tidak ditemukan</div>
            <div className="text-gray-500 mb-4">Akun Anda tidak memiliki data profile yang valid. Silakan hubungi admin atau logout lalu login kembali.</div>
            <LogoutButton />
          </div>
        </div>
      );
    }
    // Default: spinner
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // Jika user sudah ter-autentikasi dan role sesuai (atau tidak ada batasan role)
  if (user && (allowedRoles.length === 0 || allowedRoles.includes(profile?.role || 'user'))) {
    return <>{children}</>;
  }

  return null;

// Komponen tombol logout
function LogoutButton() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
      }}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
}
