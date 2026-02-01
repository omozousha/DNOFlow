"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorksheetProject } from "@/types/worksheet-project";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Archive, Loader2 } from "lucide-react";

interface ArchiveProjectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  project: WorksheetProject | null;
  onSuccess?: () => void;
}

export function ArchiveProjectDialog({
  open,
  setOpen,
  project,
  onSuccess,
}: ArchiveProjectDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    if (!project?.id) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Update project with archive flag
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: userId,
          archive_reason: reason || null,
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      // Log the archive action (optional - don't fail if logging fails)
      try {
        const { error: logError } = await supabase
          .from('project_logs')
          .insert({
            project_id: project.id,
            action: 'archived',
            field_changed: 'is_archived',
            old_value: 'false',
            new_value: 'true',
            changed_by: userId,
            metadata: {
              reason: reason || 'No reason provided',
              project_name: project.nama_project,
              no_project: project.no_project,
            }
          });

        if (logError) {
          console.warn('Failed to log archive action:', logError.message || logError);
          // Don't throw - logging is optional
        }
      } catch (logException) {
        console.warn('Exception while logging archive action:', logException);
        // Don't throw - logging is optional
      }

      toast.success("Project berhasil diarsipkan", {
        description: `${project.nama_project} telah dipindahkan ke arsip`
      });

      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Failed to archive project:', err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error("Gagal mengarsipkan project", {
        description: message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Project
          </AlertDialogTitle>
          <AlertDialogDescription>
            Anda yakin ingin mengarsipkan project ini?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Project:</p>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-semibold">{project?.nama_project}</p>
              <p className="text-sm text-muted-foreground">{project?.no_project}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan (Opsional)</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan pengarsipan project ini..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive Project"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
