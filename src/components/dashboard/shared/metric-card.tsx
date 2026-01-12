// Reusable Metric Card Component
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  description, 
  variant = 'default' 
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
    info: 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20',
  };

  return (
    <Card className={cn(variantStyles[variant], "h-full")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-background rounded-lg">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <div className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
      </CardContent>
    </Card>
  );
}
