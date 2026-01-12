import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from '@/components/auth/protected-route';

export default function ControllerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'owner', 'controller']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}