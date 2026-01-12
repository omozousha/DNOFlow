"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { WorksheetProject } from "@/types/worksheet-project";
import { supabase } from "@/lib/supabase/client";
import { FileText, User, Clock, Activity } from "lucide-react";

interface ProjectLogsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  project: WorksheetProject | null;
}

interface LogEntry {
  id: string;
  project_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_email: string | null;
  changed_at: string;
}

export function ProjectLogsDialog({ open, setOpen, project }: ProjectLogsDialogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project?.id) {
      fetchLogs();
    }
  }, [open, project?.id]);

  async function fetchLogs() {
    if (!project?.id) return;

    setLoading(true);
    try {
      // Fetch project history logs
      const { data, error } = await supabase
        .from('project_logs')
        .select(`
          *,
          profiles:changed_by (
            email,
            full_name
          )
        `)
        .eq('project_id', project.id)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Map data with profile info
      const mappedLogs = (data || []).map((log: any) => ({
        id: log.id,
        project_id: log.project_id,
        action: log.action,
        field_changed: log.field_changed,
        old_value: log.old_value,
        new_value: log.new_value,
        changed_by: log.profiles?.full_name || 'Unknown User',
        changed_by_email: log.profiles?.email || null,
        changed_at: log.changed_at,
      }));

      setLogs(mappedLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  function getActionBadge(action: string) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      created: "default",
      updated: "secondary",
      archived: "destructive",
      restored: "outline",
    };
    return <Badge variant={variants[action] || "outline"}>{action.toUpperCase()}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Project Activity Logs
          </DialogTitle>
          <DialogDescription>
            Riwayat perubahan untuk: <span className="font-semibold">{project?.nama_project}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada riwayat perubahan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {getActionBadge(log.action)}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.changed_at)}
                    </div>
                  </div>

                  {log.field_changed && (
                    <div className="text-sm">
                      <span className="font-medium">Field:</span>{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {log.field_changed}
                      </code>
                    </div>
                  )}

                  {(log.old_value || log.new_value) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Old:</span>
                        <div className="mt-1 p-2 bg-muted rounded text-xs break-words">
                          {log.old_value || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-primary">New:</span>
                        <div className="mt-1 p-2 bg-primary/10 rounded text-xs break-words">
                          {log.new_value || "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <User className="h-3 w-3" />
                    <span>{log.changed_by}</span>
                    {log.changed_by_email && (
                      <span className="text-muted-foreground/60">({log.changed_by_email})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
