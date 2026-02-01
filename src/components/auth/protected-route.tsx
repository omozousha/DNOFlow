'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardPath, type UserRole } from '@/lib/auth-utils';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

function isUserRole(value: string): value is UserRole {
  return value === 'admin' || value === 'owner' || value === 'controller' || value === 'user';
}

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
  const { user, profile, loading, profileStatus } = useAuth();
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
        const safeRole: UserRole = isUserRole(userRole) ? userRole : 'user';
        const redirectPath = getDashboardPath(safeRole);
        // ...existing code...
        router.push(redirectPath);
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router, hasRedirected]);



  // 1. Spinner hanya saat loading === true dan profileStatus !== 'error'
  if (loading && profileStatus !== 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // 2. Jika error profile (fetchProfile gagal), tampilkan error state (tidak pernah spinner)
  if (profileStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Gagal memuat profile</div>
          <div className="text-gray-500 mb-4">Terjadi kesalahan saat mengambil data profile. Silakan logout lalu login kembali, atau hubungi admin.</div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // 2. Jika user belum login (setelah loading selesai), redirect
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Anda belum login</div>
          <div className="text-gray-500 mb-4">Silakan login untuk mengakses halaman ini.</div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // 3. Jika ada role protection dan profile belum siap, tampilkan state memuat (bukan "Profile tidak ditemukan")
  if (allowedRoles.length > 0 && !profile) {
    if (profileStatus === 'loading' || profileStatus === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-10 w-10" />
            <div className="text-center">
              <div className="text-xl font-semibold mb-2">Memuat profile...</div>
              <div className="text-gray-500 mb-4">Jika terlalu lama, coba refresh atau logout lalu login kembali.</div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      );
    }

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

  // 4. Jika user login, profile ada, tapi role tidak sesuai (tidak pernah spinner)
  if (user && profile && allowedRoles.length > 0 && !allowedRoles.includes(profile.role || 'user')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Akses ditolak</div>
          <div className="text-gray-500 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  // 5. Jika user login dan (tidak ada role protection atau role sesuai), tampilkan children
  if (user && (allowedRoles.length === 0 || (profile && allowedRoles.includes(profile.role || 'user')))) {
    return <>{children}</>;
  }

  // 6. Fallback: tampilkan error unknown state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-center">
        <div className="text-xl font-semibold mb-2">Terjadi kesalahan</div>
        <div className="text-gray-500 mb-4">Status autentikasi tidak diketahui. Silakan logout lalu login kembali.</div>
        <LogoutButton />
      </div>
    </div>
  );

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
