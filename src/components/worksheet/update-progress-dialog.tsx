"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WorksheetProject } from "@/types/worksheet-project";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface UpdateProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: WorksheetProject | null;
  onSuccess?: () => void;
}

// Progress options based on the system
const PROGRESS_OPTIONS = [
  { value: "REJECT", label: "REJECT" },
  { value: "PENDING / HOLD", label: "PENDING / HOLD" },
  { value: "CREATED BOQ", label: "CREATED BOQ" },
  { value: "CHECKED BOQ", label: "CHECKED BOQ" },
  { value: "BEP", label: "BEP" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "SPK SURVEY", label: "SPK SURVEY" },
  { value: "SURVEY", label: "SURVEY" },
  { value: "DRM", label: "DRM" },
  { value: "APPROVED BOQ DRM", label: "APPROVED BOQ DRM" },
  { value: "SPK", label: "SPK" },
  { value: "MOS", label: "MOS" },
  { value: "PERIZINAN", label: "PERIZINAN" },
  { value: "CONST", label: "CONST" },
  { value: "COMMTEST", label: "COMMTEST" },
  { value: "UT", label: "UT" },
  { value: "REKON", label: "REKON" },
  { value: "BAST", label: "BAST" },
  { value: "BALOP", label: "BALOP" },
  { value: "DONE", label: "DONE" },
];

export function UpdateProgressDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: UpdateProgressDialogProps) {
  const [progress, setProgress] = useState("");
  const [portTerisi, setPortTerisi] = useState("");
  const [remark, setRemark] = useState("");
  const [issue, setIssue] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setProgress(project.progress || "");
      setPortTerisi(project.port_terisi || "");
      setRemark(project.remark || "");
      setIssue(project.issue || "");
      setNextAction(project.next_action || "");
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project?.id) return;

    setLoading(true);

    try {
      // Calculate derived fields
      const port = parseInt(project.port || "0");
      const portTerisiNum = parseInt(portTerisi || "0");
      const occupancy = port > 0 ? Math.round((portTerisiNum / port) * 100) : 0;
      const idlePort = port - portTerisiNum;

      // Update project
      const { error } = await supabase
        .from("projects")
        .update({
          progress,
          port_terisi: portTerisi,
          idle_port: idlePort.toString(),
          occupancy: `${occupancy}`,
          remark,
          issue,
          next_action: nextAction,
          update_progress: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Progress berhasil diupdate");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Gagal update progress: " + message);
    } finally {
      setLoading(false);
    }
  }

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Progress Project</DialogTitle>
          <DialogDescription>
            {project.nama_project} - {project.no_project}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Selection */}
          <div className="space-y-2">
            <Label htmlFor="progress" className="required">
              Progress
            </Label>
            <select
              id="progress"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">Pilih Progress...</option>
              {PROGRESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Port Terisi */}
          <div className="space-y-2">
            <Label htmlFor="port_terisi">Port Terisi</Label>
            <div className="text-sm text-muted-foreground mb-1">
              Total Port: {project.port || "0"}
            </div>
            <input
              id="port_terisi"
              type="number"
              min="0"
              max={parseInt(project.port || "0")}
              value={portTerisi}
              onChange={(e) => setPortTerisi(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Jumlah port yang terisi"
            />
          </div>

          {/* Remark */}
          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Issue */}
          <div className="space-y-2">
            <Label htmlFor="issue">Issue</Label>
            <textarea
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Masalah yang dihadapi..."
            />
          </div>

          {/* Next Action */}
          <div className="space-y-2">
            <Label htmlFor="next_action">Next Action</Label>
            <textarea
              id="next_action"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Rencana tindak lanjut..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Update Progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
