import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from '@/components/auth/protected-route';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'owner']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}