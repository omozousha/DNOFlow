import { ReactNode } from 'react';
import ProtectedRoute from '@/components/auth/protected-route';

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}