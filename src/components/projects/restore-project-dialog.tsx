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
import { WorksheetProject } from "@/types/worksheet-project";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArchiveRestore, Loader2 } from "lucide-react";

interface RestoreProjectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  project: WorksheetProject | null;
  onSuccess?: () => void;
}

export function RestoreProjectDialog({
  open,
  setOpen,
  project,
  onSuccess,
}: RestoreProjectDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    if (!project?.id) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Update project to restore from archive
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      // Log the restore action (optional - don't fail if logging fails)
      try {
        const { error: logError } = await supabase
          .from('project_logs')
          .insert({
            project_id: project.id,
            action: 'restored',
            field_changed: 'is_archived',
            old_value: 'true',
            new_value: 'false',
            changed_by: userId,
            metadata: {
              project_name: project.nama_project,
              no_project: project.no_project,
            }
          });

        if (logError) {
          console.warn('Failed to log restore action:', logError.message || logError);
        }
      } catch (logException) {
        console.warn('Exception while logging restore action:', logException);
      }

      toast.success("Project berhasil direstore", {
        description: `${project.nama_project} telah dikembalikan ke daftar aktif`
      });

      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Failed to restore project:', err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error("Gagal merestore project", {
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
            <ArchiveRestore className="h-5 w-5" />
            Restore Project
          </AlertDialogTitle>
          <AlertDialogDescription>
            Anda yakin ingin merestore project ini ke daftar aktif?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <p className="text-sm font-medium">Project:</p>
          <div className="p-3 bg-muted rounded-md">
            <p className="font-semibold">{project?.nama_project}</p>
            <p className="text-sm text-muted-foreground">{project?.no_project}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRestore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              "Restore Project"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
