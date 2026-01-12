// Regional Distribution Card Component
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin } from "lucide-react";

export interface RegionalStat {
  name: string;
  count: number;
  ports: number;
  percentage: number;
}

interface RegionalDistributionCardProps {
  stats: RegionalStat[];
}

export function RegionalDistributionCard({ stats }: RegionalDistributionCardProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Regional Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {stats.map((region) => (
          <div key={region.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="font-medium">{region.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold tabular-nums">{region.count}</span>
                <span className="text-muted-foreground">({region.ports})</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Progress 
                value={region.percentage} 
                className="h-1.5 flex-1" 
                indicatorClassName="bg-primary"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                {region.percentage}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
