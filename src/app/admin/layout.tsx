import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from '@/components/auth/protected-route';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}