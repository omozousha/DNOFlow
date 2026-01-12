// Project Status Distribution Card Component
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusItem } from "../shared/status-item";
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  PlayCircle
} from "lucide-react";

interface ProjectStats {
  total: number;
  done: number;
  construction: number;
  ny_construction: number;
  rescheduled: number;
  cancel: number;
  donePorts: number;
  constructionPorts: number;
  nyConstructionPorts: number;
  rescheduledPorts: number;
  cancelPorts: number;
}

interface StatusDistributionCardProps {
  stats: ProjectStats;
}

export function StatusDistributionCard({ stats }: StatusDistributionCardProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5" />
          Project Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <StatusItem 
          label="Done" 
          value={stats.done} 
          total={stats.total}
          ports={stats.donePorts}
          color="bg-green-500"
          icon={<CheckCircle2 className="h-3 w-3 text-green-600" />}
        />
        <StatusItem 
          label="Construction" 
          value={stats.construction} 
          total={stats.total}
          ports={stats.constructionPorts}
          color="bg-blue-500"
          icon={<PlayCircle className="h-3 w-3 text-blue-600" />}
        />
        <StatusItem 
          label="NY Construction" 
          value={stats.ny_construction} 
          total={stats.total}
          ports={stats.nyConstructionPorts}
          color="bg-purple-500"
          icon={<Clock className="h-3 w-3 text-purple-600" />}
        />
        <StatusItem 
          label="Rescheduled 2026" 
          value={stats.rescheduled} 
          total={stats.total}
          ports={stats.rescheduledPorts}
          color="bg-amber-500"
          icon={<AlertCircle className="h-3 w-3 text-amber-600" />}
        />
        <StatusItem 
          label="Cancelled" 
          value={stats.cancel} 
          total={stats.total}
          ports={stats.cancelPorts}
          color="bg-red-500"
          icon={<XCircle className="h-3 w-3 text-red-600" />}
        />
      </CardContent>
    </Card>
  );
}
