// Role-based redirect helper
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface RoleRedirectProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleRedirect({ allowedRoles, children }: RoleRedirectProps) {
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && !allowedRoles.includes(profile.role)) {
      router.replace('/');
    }
  }, [profile, allowedRoles, router]);

  return children;
}
