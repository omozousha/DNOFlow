"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, MapPin } from "lucide-react";
import { useMemo } from "react";

type ProjectLike = {
  progress?: string | null;
  tanggal_active?: string | null;
  target_active?: string | null;
  nama_project?: string | null;
  no_project?: string | null;
  regional?: string | null;
};

interface UpcomingRFSCardProps {
  projects: ProjectLike[];
}

export function UpcomingRFSCard({ projects }: UpcomingRFSCardProps) {
  const upcomingProjects = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter projects that are in construction phase and not yet RFS (active)
    const constructionProjects = projects.filter(p => {
      const progress = (p.progress || '').toLowerCase();
      const isConstruction = progress.includes('construction') || 
                            progress.includes('const') || 
                            progress.includes('commtest') ||
                            progress.includes('ut') ||
                            progress.includes('perizinan') ||
                            progress.includes('mos');
      
      // Exclude projects that are already done/deployed
      const isDone = progress.includes('done') || 
                     progress.includes('deployment') ||
                     progress.includes('18.');
      
      // Check if not yet active (RFS)
      const notYetActive = !p.tanggal_active || p.tanggal_active === '';
      
      return isConstruction && !isDone && notYetActive;
    });

    // Calculate progress percentage and estimate RFS
    const projectsWithProgress = constructionProjects.map(p => {
      const progress = (p.progress || '').toLowerCase();
      let percentage = 50; // default mid-construction
      
      // Determine progress percentage based on status
      if (progress.includes('ut') || progress.includes('14')) {
        percentage = 90;
      } else if (progress.includes('commtest') || progress.includes('13')) {
        percentage = 75;
      } else if (progress.includes('const') || progress.includes('12')) {
        percentage = 60;
      } else if (progress.includes('perizinan') || progress.includes('11')) {
        percentage = 40;
      } else if (progress.includes('mos') || progress.includes('10')) {
        percentage = 30;
      }

      // Calculate days to RFS based on target_active date
      let daysToRFS = Math.round((100 - percentage) * 2); // default fallback
      let targetDate: Date | null = null;

      if (p.target_active) {
        try {
          targetDate = new Date(p.target_active);
          targetDate.setHours(0, 0, 0, 0);
          
          // Calculate difference in days
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // If target date is valid and in the future or near past
          if (!isNaN(diffDays) && diffDays > -30) { // Include up to 30 days overdue
            daysToRFS = diffDays;
          }
        } catch {
          // Keep fallback estimate if date parsing fails
        }
      }

      return {
        name: p.nama_project || p.no_project || 'Unknown Project',
        regional: p.regional || 'N/A',
        progress: percentage,
        daysToRFS,
        targetDate,
        isOverdue: daysToRFS < 0,
      };
    });

    // Sort by days to RFS (ascending) and take top 3
    // Projects closer to RFS come first
    return projectsWithProgress
      .sort((a, b) => {
        // Prioritize non-overdue projects, then sort by days
        if (a.isOverdue !== b.isOverdue) {
          return a.isOverdue ? 1 : -1;
        }
        return Math.abs(a.daysToRFS) - Math.abs(b.daysToRFS);
      })
      .slice(0, 3);
  }, [projects]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card className={cn(
        "group relative overflow-hidden h-full",
        "transition-all duration-200",
        "border border-border/50 hover:border-primary/30",
        "bg-card hover:bg-card/95",
        "hover:shadow-md"
      )}>
        {/* Subtle gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-br from-primary/3 to-transparent"
        )} />

        <CardHeader className="relative p-2 sm:p-3 pb-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              "bg-green-500/10 text-green-500",
              "transition-all duration-200 group-hover:scale-105"
            )}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold">
              UPCOMING RFS
            </CardTitle>
            <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto">
              Top 3
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative p-2 sm:p-3 pt-1 space-y-1.5">
          {upcomingProjects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No projects in construction phase
            </p>
          ) : (
            upcomingProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className={cn(
                  "p-1.5 rounded-md",
                  "border border-border/50",
                  "bg-background/50",
                  "hover:bg-background transition-colors duration-200",
                  "space-y-0.5"
                )}
              >
                {/* Project Name */}
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium line-clamp-1 flex-1">
                    {project.name}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] h-4 px-1 shrink-0",
                      project.progress >= 80 && "border-green-500/50 bg-green-500/5 text-green-500",
                      project.progress >= 60 && project.progress < 80 && "border-blue-500/50 bg-blue-500/5 text-blue-500",
                      project.progress < 60 && "border-amber-500/50 bg-amber-500/5 text-amber-500"
                    )}
                  >
                    {project.progress}%
                  </Badge>
                </div>

                {/* Regional & Days */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{project.regional}</span>
                  </div>
                  <span className={cn(
                    "font-medium",
                    project.isOverdue && "text-red-500"
                  )}>
                    {project.isOverdue 
                      ? `${Math.abs(project.daysToRFS)} days overdue`
                      : `~${project.daysToRFS} days to RFS`
                    }
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className={cn(
                      "h-full",
                      project.progress >= 80 && "bg-green-500",
                      project.progress >= 60 && project.progress < 80 && "bg-blue-500",
                      project.progress < 60 && "bg-amber-500"
                    )}
                  />
                </div>
              </motion.div>
            ))
          )}

          {/* Bottom accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
