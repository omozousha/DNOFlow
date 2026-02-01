// Reusable admin dashboard content for /admin and /admin/dashboard
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  FolderKanban, 
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Types
export type UserRow = {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  is_active: boolean;
};
export type ActivityLog = {
  id: string;
  action: string;
  changed_at?: string;
  profile_id?: string;
  user: string;
  time: string;
};

type ProjectProgressStats = {
  total: number;
  done: number;
  in_progress: number;
  pending: number;
};

type ProjectRow = {
  progress: string | null;
};

export default function AdminDashboardContent() {
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectProgressStats>({ 
    total: 0, 
    done: 0, 
    in_progress: 0,
    pending: 0 
  });
  const [recentLogins, setRecentLogins] = useState<{ user: string; time: string }[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivityLogs, setTotalActivityLogs] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalActivityLogs / itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      // User stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      const inactiveUsers = (totalUsers || 0) - (activeUsers || 0);
      
      // Activity logs with pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const { data: logs, count: totalCount } = await supabase
        .from('profiles_audit_log')
        .select('id, action, changed_at, profile_id', { count: 'exact' })
        .order('changed_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);
      
      setTotalActivityLogs(totalCount || 0);
      
      // Recent logins (last 5)
      const { data: loginLogs } = await supabase
        .from('profiles')
        .select('full_name, email, last_login')
        .not('last_login', 'is', null)
        .order('last_login', { ascending: false })
        .limit(5);
      
      // Project stats - get detailed progress breakdown
      const { data: projects } = await supabase
        .from('projects')
        .select('progress');
      
      const typedProjects = (projects ?? []) as ProjectRow[];
      const total = typedProjects.length;
      const done = typedProjects.filter(p => p.progress === 'done').length;
      const in_progress = typedProjects.filter(
        p => !!p.progress && p.progress !== 'done' && p.progress !== 'pending'
      ).length;
      const pending = typedProjects.filter(p => p.progress === 'pending').length;
      
      setProjectStats({ total, done, in_progress, pending });
      
      // Map logs to user
      const { data: userList } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      const userMap = Object.fromEntries((userList || []).map(u => [u.id, u]));
      
      const mappedLogs: ActivityLog[] = (logs || []).map(log => ({
        ...log,
        user: userMap[log.profile_id || '']?.full_name ||
              userMap[log.profile_id || '']?.email ||
              'Unknown',
        time: log.changed_at
          ? new Date(log.changed_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '',
      }));
      
      const mappedLogins = (loginLogs || []).map(log => ({
        user: log.full_name || log.email,
        time: log.last_login 
          ? new Date(log.last_login).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-'
      }));
      
      setUserStats({ totalUsers: totalUsers || 0, activeUsers: activeUsers || 0, inactiveUsers });
      setActivityLogs(mappedLogs);
      setRecentLogins(mappedLogins);
    };
    fetchData();
  }, [currentPage]); // Re-fetch when page changes

  const progressPercentage = projectStats.total ? Math.round((projectStats.done / projectStats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview sistem manajemen dan monitoring
        </p>
      </div>

      {/* KEY METRICS - Consistent Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={userStats.totalUsers}
          icon={<Users className="h-5 w-5" />}
          description="Semua pengguna terdaftar"
          variant="default"
        />
        <MetricCard
          title="Active Users"
          value={userStats.activeUsers}
          icon={<UserCheck className="h-5 w-5" />}
          description={`${userStats.inactiveUsers} inactive`}
          variant="success"
        />
        <MetricCard
          title="Total Projects"
          value={projectStats.total}
          icon={<FolderKanban className="h-5 w-5" />}
          description={`${projectStats.done} selesai`}
          variant="default"
        />
        <MetricCard
          title="Progress Rate"
          value={`${progressPercentage}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Tingkat penyelesaian"
          variant="info"
        />
      </div>

      {/* PROJECT STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Project Status
            </CardTitle>
            <CardDescription>Distribusi status project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusItem 
              label="Done" 
              value={projectStats.done} 
              total={projectStats.total}
              color="bg-green-500"
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            />
            <StatusItem 
              label="In Progress" 
              value={projectStats.in_progress} 
              total={projectStats.total}
              color="bg-blue-500"
              icon={<Clock className="h-4 w-4 text-blue-600" />}
            />
            <StatusItem 
              label="Pending" 
              value={projectStats.pending} 
              total={projectStats.total}
              color="bg-amber-500"
              icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Logins
            </CardTitle>
            <CardDescription>5 login terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogins.length > 0 ? (
                recentLogins.map((login, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{login.user}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{login.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada data login</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITY LOG */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Log
              </CardTitle>
              <CardDescription>
                Menampilkan {activityLogs.length} dari {totalActivityLogs} aktivitas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.length > 0 ? (
                  activityLogs.map((log, i) => (
                    <tr key={log.id || i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{log.user}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{log.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Tidak ada aktivitas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9 h-9 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Consistent Metric Card Component
function MetricCard({
  title,
  value,
  icon,
  description,
  variant = 'default'
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
    info: 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 bg-background rounded-lg">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Status Item with Progress Bar
function StatusItem({
  label,
  value,
  total,
  color,
  icon
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1" indicatorClassName={color} />
        <span className="text-xs text-muted-foreground w-12 text-right">{percentage}%</span>
      </div>
    </div>
  );
}
