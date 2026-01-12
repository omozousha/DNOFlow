// Status Item with Progress Bar
import { Progress } from "@/components/ui/progress";

interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  ports: number;
  color: string;
}

export function StatusItem({ 
  icon, 
  label, 
  value, 
  total, 
  ports, 
  color 
}: StatusItemProps) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-bold tabular-nums">{value}</span>
          <span className="text-muted-foreground">({ports})</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Progress value={percentage} className="flex-1 h-1.5" indicatorClassName={color} />
        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
