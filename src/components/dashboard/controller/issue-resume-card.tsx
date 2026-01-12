"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

interface IssueResume {
  summary: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  aiGenerated?: boolean;
  issuePercentage?: string;
  totalWithIssues?: number;
}

interface IssueResumeCardProps {
  projects: any[];
}

export function IssueResumeCard({ projects }: IssueResumeCardProps) {
  const [resume, setResume] = useState<IssueResume>({
    summary: "🔄 Menganalisis semua issue dari semua proyek dengan AI...",
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    totalWithIssues: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCached, setIsCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const analyzeIssuesWithAI = async (forceRefresh = false) => {
      if (projects.length === 0) {
        setResume({
          summary: "📭 Tidak ada data proyek untuk dianalisis.",
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          totalWithIssues: 0,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`[IssueResume] Analyzing ${projects.length} projects for issues...${forceRefresh ? ' (force refresh)' : ''}`);
        
        const response = await fetch('/api/ai/issue-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            projects,
            forceRefresh 
          }),
        });

        const data = await response.json();
        
        console.log('[IssueResume] AI Analysis Result:', {
          aiGenerated: data.aiGenerated,
          cached: data.cached,
          issuesFound: data.mediumCount,
          criticalCount: data.criticalCount,
          highCount: data.highCount,
          generatedAt: data.generatedAt,
        });
        
        // Update cached state
        setIsCached(data.cached || false);
        setGeneratedAt(data.generatedAt || null);
        
        // API always returns 200 with data or error
        setResume({
          summary: data.summary || "❌ Tidak dapat menghasilkan resume.",
          criticalCount: data.criticalCount || 0,
          highCount: data.highCount || 0,
          mediumCount: data.mediumCount || 0,
          aiGenerated: data.aiGenerated,
          issuePercentage: data.issuePercentage,
          totalWithIssues: data.mediumCount || 0,
        });
        
        if (data.error) {
          console.warn('[IssueResume] Using fallback analysis:', data.error);
          setError('Using fallback analysis');
        }
      } catch (err: any) {
        console.error('[IssueResume] Error fetching AI analysis:', err);
        setError(err.message);
        
        // Fallback to simple local analysis
        const criticalCount = projects.filter(p => 
          p.progress?.toLowerCase().includes('cancel') || 
          p.progress?.toLowerCase().includes('reject')
        ).length;
        const highCount = projects.filter(p => 
          p.progress?.toLowerCase().includes('pending') || 
          p.progress?.toLowerCase().includes('hold')
        ).length;
        const withIssues = projects.filter(p =>
          p.issue && p.issue.trim() !== '' && p.issue.toLowerCase() !== 'n/a'
        ).length;

        let summary = "";
        if (withIssues > 0) {
          summary = `📊 ${withIssues} dari ${projects.length} proyek memiliki issue. `;
        }
        if (criticalCount > 0) {
          summary += `🚨 ${criticalCount} proyek critical (cancel/reject). `;
        }
        if (highCount > 0) {
          summary += `⚠️ ${highCount} proyek tertunda atau hold. `;
        }
        if (!summary) {
          summary = "✅ Semua proyek berjalan baik tanpa issue signifikan.";
        }

        setResume({
          summary: summary.trim(),
          criticalCount,
          highCount,
          mediumCount: withIssues,
          totalWithIssues: withIssues,
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    analyzeIssuesWithAI();
  }, [projects, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    analyzeIssuesWithAI(true); // Force refresh on manual button click
  };

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
              "bg-amber-500/10 text-amber-500",
              "transition-all duration-200 group-hover:scale-105"
            )}>
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold">
              AI ISSUE RESUME
            </CardTitle>
            {resume.totalWithIssues !== undefined && resume.totalWithIssues > 0 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-500/10 text-blue-500 border-blue-500/30">
                {resume.totalWithIssues} Issues
              </Badge>
            )}
            {isCached && !isLoading && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-purple-500/50 bg-purple-500/5 text-purple-500">
                📦 Cached
              </Badge>
            )}
            {isLoading && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 animate-pulse">
                AI Analyzing...
              </Badge>
            )}
            {!isLoading && resume.aiGenerated === true && !isCached && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500/50 bg-green-500/5 text-green-500">
                ✨ AI Generated
              </Badge>
            )}
            {!isLoading && resume.aiGenerated === false && !isCached && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/50 bg-amber-500/5 text-amber-500">
                ⚡ Fallback Mode
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                "ml-auto h-6 w-6 p-0",
                "hover:bg-amber-500/10 hover:text-amber-500",
                "transition-all duration-200"
              )}
              title={isCached ? "Force Regenerate AI Analysis" : "Refresh AI Analysis"}
            >
              <RotateCw className={cn(
                "h-3 w-3",
                isLoading && "animate-spin"
              )} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative p-2 sm:p-3 pt-1 space-y-2">
          {/* Summary Text */}
          <p className={cn(
            "text-xs leading-relaxed",
            "text-muted-foreground",
            isLoading && "animate-pulse"
          )}>
            {resume.summary}
          </p>

          {/* Issue Counters */}
          <div className="flex flex-wrap gap-1.5">
            {resume.criticalCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] h-5 px-1.5 border-red-500/50 bg-red-500/5 text-red-500"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                Critical: {resume.criticalCount}
              </Badge>
            )}
            {resume.highCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] h-5 px-1.5 border-amber-500/50 bg-amber-500/5 text-amber-500"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                High: {resume.highCount}
              </Badge>
            )}
            {resume.mediumCount > 0 && (
              <Badge 
                variant="outline" 
                className="text-[10px] h-5 px-1.5 border-blue-500/50 bg-blue-500/5 text-blue-500"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                Issues: {resume.mediumCount}
              </Badge>
            )}
          </div>

          {/* Bottom accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
