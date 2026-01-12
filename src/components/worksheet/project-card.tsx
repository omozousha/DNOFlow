"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WorksheetProject } from "@/types/worksheet-project";
import { MapPin, Calendar, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: WorksheetProject;
  onUpdateProgress?: (project: WorksheetProject) => void;
}

// Helper to get progress percentage from persentase field
function getProgressPercentage(persentase?: string): number {
  if (!persentase) return 0;
  const parsed = parseInt(persentase);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to get status color and gradient
function getStatusTheme(status?: string): { 
  bgGradient: string; 
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  accentColor: string;
} {
  if (!status) return { 
    bgGradient: "from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800", 
    badgeVariant: "outline",
    accentColor: "bg-gray-400"
  };
  
  const s = status.toLowerCase();
  if (s === "deployment" || s === "done") return { 
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20", 
    badgeVariant: "default",
    accentColor: "bg-green-500"
  };
  if (s === "construction" || s === "rfs") return { 
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20", 
    badgeVariant: "secondary",
    accentColor: "bg-blue-500"
  };
  if (s === "cancel" || s === "reject") return { 
    bgGradient: "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20", 
    badgeVariant: "destructive",
    accentColor: "bg-red-500"
  };
  
  return { 
    bgGradient: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20", 
    badgeVariant: "outline",
    accentColor: "bg-orange-500"
  };
}

// Helper to get progress phase
function getProgressPhase(progress?: string): string {
  if (!progress) return "N/A";
  const progressLower = progress.toLowerCase();
  
  if (progressLower.includes("boq") || progressLower.includes("survey") || 
      progressLower.includes("design") || progressLower.includes("desain") ||
      progressLower.includes("rab") || progressLower.includes("spk")) {
    return "Planning";
  }
  if (progressLower.includes("mos") || progressLower.includes("const") || 
      progressLower.includes("ut")) {
    return "Construction";
  }
  if (progressLower.includes("rekon") || progressLower.includes("bast") ||
      progressLower.includes("balop") || progressLower.includes("done")) {
    return "Deployment";
  }
  if (progressLower.includes("reject")) return "Rejected";
  if (progressLower.includes("pending")) return "Pending";
  
  return "In Progress";
}

export function ProjectCard({ project, onUpdateProgress }: ProjectCardProps) {
  const progressPercentage = getProgressPercentage(project.persentase);
  const progressPhase = getProgressPhase(project.progress);
  const theme = getStatusTheme(project.status);
  const totalPorts = parseInt(project.port || "0");
  const usedPorts = parseInt(project.port_terisi || "0");
  const occupancy = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]",
        "bg-gradient-to-br", theme.bgGradient,
        "border-l-4 border-l-transparent hover:border-l-primary"
      )}
      onClick={() => onUpdateProgress?.(project)}
    >
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", theme.accentColor)} />
      
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 leading-none">
                {project.regional || "N/A"}
              </Badge>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 leading-none">
                {progressPhase}
              </Badge>
            </div>
            <h3 className="font-bold text-xs sm:text-sm leading-tight line-clamp-1 mb-0.5">
              {project.nama_project || "Untitled Project"}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              {project.no_project || "No ID"}
            </p>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateProgress?.(project);
            }}
            className={cn(
              "p-1 rounded-full bg-background/80 backdrop-blur-sm",
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hover:bg-primary hover:text-primary-foreground",
              "shadow-sm"
            )}
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>

        {/* Location - Simplified */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{project.pop || "N/A"}</span>
          {project.mitra && (
            <>
              <span>•</span>Mitra:
              <span className="truncate">{project.mitra}</span>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <span className="text-sm sm:text-base font-bold tabular-nums">
              {progressPercentage}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1" />
        </div>

        {/* Footer - Compact */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t">
          <div className="flex items-center gap-1.5">
            <Badge variant={theme.badgeVariant} className="text-[9px] px-1.5 py-0 h-4">
              {project.status || "N/A"}
            </Badge>
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {usedPorts}/{totalPorts} • {occupancy}%
            </span>
          </div>
          
          {project.target_active && (
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              <span className="font-medium">
                {new Date(project.target_active).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short"
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
