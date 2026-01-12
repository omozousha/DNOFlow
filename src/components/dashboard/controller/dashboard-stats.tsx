import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Users, FileText, CheckCircle } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
};

const StatCard = ({ title, value, description, icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-4 w-4 text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

type DashboardStatsProps = {
  stats: {
    totalProjects: number;
    completedProjects: number;
    activeUsers: number;
    tasksCompleted: number;
  };
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        description="+20% from last month"
        icon={<FileText className="h-4 w-4" />}
      />
      <StatCard
        title="Completed"
        value={stats.completedProjects}
        description="+5% from last month"
        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
      />
      <StatCard
        title="Active Users"
        value={stats.activeUsers}
        description="+12% from last month"
        icon={<Users className="h-4 w-4" />}
      />
      <StatCard
        title="Tasks Completed"
        value={`${stats.tasksCompleted}%`}
        description="+10% from last month"
        icon={<BarChart2 className="h-4 w-4" />}
      />
    </div>
  );
}
