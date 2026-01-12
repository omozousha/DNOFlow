"use client";

import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WorksheetProject } from "@/types/worksheet-project";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/date-picker";
import { AttachmentUpload } from "@/components/worksheet/attachment-upload";
import { AttachmentList } from "@/components/worksheet/attachment-list";
import { Loader2 } from "lucide-react";

interface UpdateProjectDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  project: WorksheetProject | null;
  onSuccess?: () => void;
}

// Progress mapping - same as new project form
const PLANNING_PROGRESS = [
  "REJECT",
  "PENDING / HOLD",
  "CREATED BOQ",
  "CHECKED BOQ",
  "BEP",
  "APPROVED",
  "SPK SURVEY",
  "SURVEY",
  "DRM",
  "APPROVED BOQ DRM",
  "SPK",
];

const DEPLOYMENT_PROGRESS = [
  "MOS",
  "PERIZINAN",
  "CONST",
  "COMMTEST",
  "UT",
  "REKON",
  "BAST",
  "BALOP",
  "DONE",
];

const PROGRESS_MAPPING: Record<string, { status: string; uic: string; percentage: number }> = {
  "REJECT": { status: "CANCEL", uic: "PLANNING & DEPLOYMENT", percentage: 0 },
  "PENDING / HOLD": { status: "PENDING", uic: "PLANNING & DEPLOYMENT", percentage: 0 },
  "CREATED BOQ": { status: "DESAIN", uic: "PLANNING", percentage: 1 },
  "CHECKED BOQ": { status: "DESAIN", uic: "PLANNING", percentage: 10 },
  "BEP": { status: "DESAIN", uic: "PLANNING", percentage: 15 },
  "APPROVED": { status: "DESAIN", uic: "PLANNING", percentage: 20 },
  "SPK SURVEY": { status: "DESAIN", uic: "PLANNING", percentage: 25 },
  "SURVEY": { status: "DESAIN", uic: "PLANNING", percentage: 30 },
  "DRM": { status: "DESAIN", uic: "PLANNING", percentage: 35 },
  "APPROVED BOQ DRM": { status: "DESAIN", uic: "PLANNING", percentage: 40 },
  "SPK": { status: "DESAIN", uic: "PLANNING", percentage: 45 },
  "MOS": { status: "CONSTRUCTION", uic: "DEPLOYMENT", percentage: 50 },
  "PERIZINAN": { status: "CONSTRUCTION", uic: "DEPLOYMENT", percentage: 55 },
  "CONST": { status: "CONSTRUCTION", uic: "DEPLOYMENT", percentage: 60 },
  "COMMTEST": { status: "CONSTRUCTION", uic: "DEPLOYMENT", percentage: 70 },
  "UT": { status: "CONSTRUCTION", uic: "DEPLOYMENT", percentage: 75 },
  "REKON": { status: "RFS", uic: "DEPLOYMENT", percentage: 80 },
  "BAST": { status: "RFS", uic: "DEPLOYMENT", percentage: 85 },
  "BALOP": { status: "RFS", uic: "DEPLOYMENT", percentage: 90 },
  "DONE": { status: "DEPLOYMENT", uic: "DEPLOYMENT", percentage: 100 },
};

// Field helper component
function Field({
  label,
  children,
  required = false,
  span = "md:col-span-1",
  hint,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  span?: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <div className={span}>
      <div className="flex items-center justify-between mb-1.5">
        <Label className={required ? "required" : ""}>
          {label}
          {hint && <span className="text-xs text-muted-foreground ml-2">({hint})</span>}
        </Label>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function UpdateProjectDrawer({ open, setOpen, project, onSuccess }: UpdateProjectDrawerProps) {
  // Get user profile for division-based filtering
  const { profile } = useAuth();
  
  // Form state - initialize with project data
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [attachmentKey, setAttachmentKey] = useState(0);

  // Determine allowed progress options based on user division
  let allowedProgress: string[] = [];
  let canEditProgress = true;
  
  if (profile?.division === "PLANNING") {
    allowedProgress = PLANNING_PROGRESS;
  } else if (profile?.division === "DEPLOYMENT") {
    allowedProgress = DEPLOYMENT_PROGRESS;
  } else if (profile?.division === "ADMIN") {
    // Admin can access all progress options
    allowedProgress = [...PLANNING_PROGRESS, ...DEPLOYMENT_PROGRESS];
  } else {
    // Unknown division - read only
    allowedProgress = [];
    canEditProgress = false;
  }

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        // Locked fields (read-only)
        regional: project.regional || "",
        no_project: project.no_project || "",
        no_spk: project.no_spk || "",
        pop: project.pop || "",
        nama_project: project.nama_project || "",
        port: project.port || "",
        jumlah_odp: project.jumlah_odp || "",
        
        // Editable fields
        mitra: project.mitra || "",
        progress: project.progress || "",
        persentase: project.persentase || "0",
        toc: project.toc || "",
        start_pekerjaan: project.start_pekerjaan || "",
        target_active: project.target_active || "",
        tanggal_active: project.tanggal_active || "",
        aging_toc: project.aging_toc || "",
        bep: project.bep || "",
        port_terisi: project.port_terisi || "",
        target_bep: project.target_bep || "",
        revenue: project.revenue || "",
        remark: project.remark || "",
        issue: project.issue || "",
        next_action: project.next_action || "",
        circulir_status: project.circulir_status || "",
      });
    }
  }, [project]);

  // Auto-update persentase when progress changes
  useEffect(() => {
    if (formData.progress) {
      const mapping = PROGRESS_MAPPING[formData.progress];
      if (mapping) {
        setFormData((prev: any) => ({
          ...prev,
          persentase: mapping.percentage.toString()
        }));
      }
    }
  }, [formData.progress]);

  function handleChange(field: string, value: any) {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }

  function handleAttachmentUpdate() {
    setAttachmentKey(prev => prev + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project?.id) return;

    setLoading(true);

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user) {
        console.error('Auth error:', authError);
        toast.error('User tidak terautentikasi. Silakan login kembali.');
        setLoading(false);
        return;
      }
      
      const userId = userData.user.id;
      console.log('Updating project as user:', userId);

      // Check user profile and permissions
      let userProfile: any = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, division, is_active')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile query error:', JSON.stringify(profileError, null, 2));
      }

      if (!profileData) {
        console.warn('No profile found in profiles table for user:', userId);
        
        // Try alternative query from users_roles table
        const { data: userRole, error: roleError } = await supabase
          .from('users_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError) {
          console.error('Error querying users_roles:', roleError);
        }

        if (userRole?.role) {
          console.log('Using role from users_roles:', userRole.role);
          userProfile = {
            id: userId,
            email: userData.user.email || '',
            role: userRole.role,
            division: null,
            is_active: true
          };
        } else {
          toast.error('User profile tidak ditemukan di database. Hubungi administrator untuk setup profile.');
          setLoading(false);
          return;
        }
      } else {
        userProfile = profileData;
      }

      if (!userProfile.is_active) {
        toast.error('User tidak aktif. Silakan hubungi administrator.');
        setLoading(false);
        return;
      }

      console.log('User profile:', JSON.stringify(userProfile, null, 2));
      console.log('Current project UIC:', project.uic);

      // ONLY Controller can update projects
      if (userProfile.role === 'admin' || userProfile.role === 'owner') {
        toast.error(
          `Permission denied: Role ${userProfile.role.toUpperCase()} tidak diizinkan untuk update project. ` +
          `Hanya Controller yang bisa melakukan update.`
        );
        setLoading(false);
        return;
      }

      // Helper to convert Date to ISO string or null
      function dateToISO(date?: Date | string | null) {
        if (!date) return null;
        if (date instanceof Date) {
          // Check if valid date
          if (isNaN(date.getTime())) return null;
          return date.toISOString().split('T')[0];
        }
        // If already a string, validate and return
        if (typeof date === 'string' && date.trim() !== '') {
          return date.trim();
        }
        return null;
      }

      // Calculate derived fields with proper type conversions
      const port = parseInt(String(formData.port || "0"));
      const portTerisi = parseInt(String(formData.port_terisi || "0"));
      const occupancy = port > 0 ? Math.round((portTerisi / port) * 100) : 0;
      // idle_port is auto-calculated by database (GENERATED ALWAYS column)
      const revenue = parseFloat(String(formData.revenue || "0"));
      const capex = revenue * 0.6;

      // Get status, UIC, and percentage from progress
      const mapping = PROGRESS_MAPPING[formData.progress] || { status: "PENDING", uic: "PLANNING & DEPLOYMENT", percentage: 0 };
      const newUIC = mapping.uic;
      const oldUIC = project.uic;

      console.log('UIC change check:', { oldUIC, newUIC, willChange: oldUIC !== newUIC });

      // Check if user can update based on CURRENT UIC (RLS checks old UIC)
      // AND check if user can update to NEW UIC (if changing)
      if (userProfile.role === 'controller') {
        // Check if controller has division
        if (!userProfile.division || userProfile.division.trim() === '') {
          toast.error(
            'Controller harus memiliki division (PLANNING atau DEPLOYMENT) untuk update project. ' +
            'Hubungi administrator untuk set division Anda.'
          );
          setLoading(false);
          return;
        }

        // If oldUIC is null/empty, controller cannot update (only can set initial via create)
        if (!oldUIC || oldUIC === 'null' || oldUIC.trim() === '') {
          toast.error(
            'Permission denied: Project ini belum memiliki UIC. ' +
            'Controller tidak bisa update project tanpa UIC. ' +
            'Hubungi administrator untuk set UIC terlebih dahulu.'
          );
          setLoading(false);
          return;
        }

        // Project already has UIC, check if controller can update it
        const canUpdateOld = 
          (userProfile.division === 'PLANNING' && ['PLANNING', 'PLANNING & DEPLOYMENT'].includes(oldUIC)) ||
          (userProfile.division === 'DEPLOYMENT' && ['DEPLOYMENT', 'PLANNING & DEPLOYMENT'].includes(oldUIC));
        
        const canUpdateNew = 
          (userProfile.division === 'PLANNING' && ['PLANNING', 'PLANNING & DEPLOYMENT'].includes(newUIC)) ||
          (userProfile.division === 'DEPLOYMENT' && ['DEPLOYMENT', 'PLANNING & DEPLOYMENT'].includes(newUIC));

        if (!canUpdateOld) {
          toast.error(
            `Permission denied: Controller ${userProfile.division} tidak bisa update project dengan UIC "${oldUIC}". ` +
            `Project ini hanya bisa diupdate oleh Controller dengan division yang sesuai.`
          );
          setLoading(false);
          return;
        }

        if (oldUIC !== newUIC && !canUpdateNew) {
          toast.error(
            `Permission denied: Controller ${userProfile.division} tidak bisa mengubah UIC dari "${oldUIC}" ke "${newUIC}". ` +
            `Pilih progress yang sesuai dengan division Anda.`
          );
          setLoading(false);
          return;
        }
      }

      // Prepare update data - convert all to string for database compatibility
      // Note: idle_port is excluded because it's a GENERATED ALWAYS column
      const updateData: Record<string, any> = {
        // Editable fields only
        mitra: formData.mitra || null,
        progress: formData.progress || null,
        toc: formData.toc ? String(formData.toc) : null,
        start_pekerjaan: dateToISO(formData.start_pekerjaan),
        target_active: dateToISO(formData.target_active),
        tanggal_active: dateToISO(formData.tanggal_active),
        aging_toc: formData.aging_toc ? String(formData.aging_toc) : null,
        bep: formData.bep ? String(formData.bep) : null,
        port_terisi: String(portTerisi),
        // idle_port: excluded - auto-calculated by database
        occupancy: String(occupancy),
        target_bep: dateToISO(formData.target_bep),
        capex: String(capex),
        revenue: String(revenue),
        uic: newUIC,
        status: mapping.status,
        persentase: String(mapping.percentage),
        update_progress: new Date().toISOString(),
        remark: formData.remark || null,
        issue: formData.issue || null,
        next_action: formData.next_action || null,
        circulir_status: formData.circulir_status || null,
      };

      console.log('Updating project:', project.id);
      console.log('Update data:', JSON.stringify(updateData, null, 2));

      const { error: updateError, data: updatedData } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project.id)
        .select();

      if (updateError) {
        console.error('Update error:', JSON.stringify(updateError, null, 2));
        console.error('Update error object:', updateError);
        toast.error(`Update error: ${updateError.message || updateError.toString() || 'Unknown error'}`);
        throw updateError;
      }

      if (!updatedData || updatedData.length === 0) {
        console.error('No data returned from update - RLS blocked');
        console.error('User profile:', userProfile);
        console.error('Project UIC:', project.uic);
        console.error('Attempted update data:', JSON.stringify(updateData, null, 2));
        
        // Provide detailed error message based on role
        let errorMsg = 'Update gagal: Permission denied. ';
        if (userProfile.role === 'controller') {
          if (userProfile.division === 'PLANNING') {
            errorMsg += 'Controller PLANNING hanya bisa update project dengan UIC "PLANNING" atau "PLANNING & DEPLOYMENT".';
          } else if (userProfile.division === 'DEPLOYMENT') {
            errorMsg += 'Controller DEPLOYMENT hanya bisa update project dengan UIC "DEPLOYMENT" atau "PLANNING & DEPLOYMENT".';
          } else {
            errorMsg += `Controller dengan division "${userProfile.division}" tidak memiliki akses update.`;
          }
          errorMsg += ` Project ini memiliki UIC "${project.uic}".`;
        } else if (userProfile.role === 'owner') {
          errorMsg += 'Owner seharusnya bisa update semua project. Hubungi administrator.';
        } else {
          errorMsg += 'Role Anda tidak memiliki permission untuk update project ini.';
        }
        
        toast.error(errorMsg);
        throw new Error('RLS policy blocked update');
      }

      const updated = Array.isArray(updatedData) ? updatedData[0] : updatedData;
      console.log('Update successful:', JSON.stringify(updated, null, 2));

      // Log changes for each field that was modified
      const changedFields = Object.keys(updateData).filter((key) => {
        const oldValue = String(project[key as keyof typeof project] || '');
        const newValue = String(updateData[key] || '');
        return oldValue !== newValue;
      });

      if (changedFields.length > 0) {
        console.log('Changed fields:', JSON.stringify(changedFields));
        
        // Create log entries for changed fields
        const logPromises = changedFields.map((field) => {
          const oldValue = project[field as keyof typeof project];
          const newValue = updateData[field];
          
          return supabase.from('project_logs').insert({
            project_id: project.id,
            action: 'updated',
            field_changed: field,
            old_value: oldValue?.toString() || null,
            new_value: newValue?.toString() || null,
            changed_by: userId,
            metadata: {
              project_name: project.nama_project,
              no_project: project.no_project,
            }
          });
        });

        const logResults = await Promise.allSettled(logPromises);
        const failedLogs = logResults.filter(r => r.status === 'rejected');
        if (failedLogs.length > 0) {
          console.warn('Some logs failed to create:', failedLogs);
        }
      }

      toast.success(
        changedFields.length > 0 
          ? `Project berhasil diupdate (${changedFields.length} field diubah)`
          : "Project berhasil diupdate (tidak ada perubahan)"
      );
      onSuccess?.();
      setOpen(false);
    } catch (error: any) {
      console.error('Update project error (stringified):', JSON.stringify(error, null, 2));
      console.error('Update project error (raw):', error);
      
      // Better error message
      let errorMessage = 'Gagal update project';
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      } else if (error?.code) {
        errorMessage += `: Error code ${error.code}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      } else {
        // Try to extract any useful info
        const errStr = error?.toString ? error.toString() : String(error);
        if (errStr !== '[object Object]') {
          errorMessage += `: ${errStr}`;
        }
      }
      
      // Log detailed error for debugging
      try {
        console.error('Error details (stringified):', JSON.stringify({
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          name: error?.name,
          stack: error?.stack
        }, null, 2));
      } catch (e) {
        console.error('Could not stringify error');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!project) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-w-7xl w-[95vw] sm:w-[90vw] lg:w-[85vw] mx-auto max-h-[95vh] flex flex-col">
        <DrawerHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-2xl">Update Project</DrawerTitle>
              <DrawerDescription>
                Update progress dan informasi project
              </DrawerDescription>
            </div>
            <Badge variant="outline">{project.no_project}</Badge>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <form id="update-form" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Identitas Project (READ-ONLY) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  Identitas Project
                  <Badge variant="secondary" className="text-xs">Read-only</Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Regional" required>
                    <Input value={formData.regional} readOnly className="bg-muted" />
                  </Field>
                  <Field label="No Project" required>
                    <Input value={formData.no_project} readOnly className="bg-muted" />
                  </Field>
                  <Field label="No SPK">
                    <Input value={formData.no_spk} readOnly className="bg-muted" />
                  </Field>
                  <Field label="POP" required>
                    <Input value={formData.pop} readOnly className="bg-muted" />
                  </Field>
                  <Field label="Nama Project" required span="md:col-span-2">
                    <Input value={formData.nama_project} readOnly className="bg-muted" />
                  </Field>
                </div>
              </div>

              {/* Kapasitas (READ-ONLY) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  Kapasitas
                  <Badge variant="secondary" className="text-xs">Read-only</Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Port">
                    <Input value={formData.port} readOnly className="bg-muted" />
                  </Field>
                  <Field label="Jumlah ODP">
                    <Input value={formData.jumlah_odp} readOnly className="bg-muted" />
                  </Field>
                </div>
              </div>

              {/* Progress & Mitra (EDITABLE) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Progress Update</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Mitra">
                    <Input
                      value={formData.mitra}
                      onChange={(e) => handleChange("mitra", e.target.value)}
                      placeholder="Nama mitra"
                    />
                  </Field>
                  <Field label="Progress">
                    {!canEditProgress ? (
                      <Input value={formData.progress} readOnly className="bg-muted" />
                    ) : (
                      <select
                        value={formData.progress}
                        onChange={(e) => handleChange("progress", e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Pilih Progress...</option>
                        {allowedProgress.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
                <Field label="Persentase Progress" badge="Auto">
                  <Input
                    value={`${formData.persentase || "0"}%`}
                    readOnly
                    className="bg-muted font-semibold text-primary"
                  />
                </Field>
              </div>

              {/* Timeline (EDITABLE) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Timeline</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="TOC (hari)" hint="Time of Construction">
                    <Input
                      type="number"
                      value={formData.toc}
                      onChange={(e) => handleChange("toc", e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Start Pekerjaan">
                    <DatePicker
                      value={formData.start_pekerjaan}
                      onChange={(value) => handleChange("start_pekerjaan", value)}
                      placeholder="Pilih tanggal start"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Target Active">
                    <DatePicker
                      value={formData.target_active}
                      onChange={(value) => handleChange("target_active", value)}
                      placeholder="Pilih target active"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Tanggal Active">
                    <DatePicker
                      value={formData.tanggal_active}
                      onChange={(value) => handleChange("tanggal_active", value)}
                      placeholder="Pilih tanggal active"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Aging TOC" hint="Auto-calculated">
                    <Input
                      value={formData.aging_toc}
                      onChange={(e) => handleChange("aging_toc", e.target.value)}
                      placeholder="Auto"
                    />
                  </Field>
                  <Field label="BEP (bulan)" hint="Break Even Point">
                    <Input
                      type="number"
                      value={formData.bep}
                      onChange={(e) => handleChange("bep", e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>

              {/* Finansial & Utilitas (EDITABLE) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Finansial & Utilitas</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Port Terisi">
                    <Input
                      type="number"
                      value={formData.port_terisi}
                      onChange={(e) => handleChange("port_terisi", e.target.value)}
                      placeholder="0"
                      max={formData.port}
                    />
                  </Field>
                  <Field label="Target BEP">
                    <DatePicker
                      value={formData.target_bep}
                      onChange={(value) => handleChange("target_bep", value)}
                      placeholder="Pilih target BEP"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Revenue">
                    <Input
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => handleChange("revenue", e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>

              {/* Catatan (EDITABLE) */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Catatan & Action</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Remark">
                    <textarea
                      value={formData.remark}
                      onChange={(e) => handleChange("remark", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                      placeholder="Catatan tambahan..."
                    />
                  </Field>
                  <Field label="Issue">
                    <textarea
                      value={formData.issue}
                      onChange={(e) => handleChange("issue", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                      placeholder="Masalah yang dihadapi..."
                    />
                  </Field>
                  <Field label="Next Action">
                    <textarea
                      value={formData.next_action}
                      onChange={(e) => handleChange("next_action", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                      placeholder="Rencana tindak lanjut..."
                    />
                  </Field>
                  <Field label="Circulir Status">
                    <select
                      value={formData.circulir_status}
                      onChange={(e) => handleChange("circulir_status", e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Pilih Status...</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="hold">Hold</option>
                      <option value="reject">Reject</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* Section 7: Dokumen */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Dokumen</h3>
                <div className="space-y-4">
                  <AttachmentList 
                    key={attachmentKey}
                    projectId={project.id!} 
                    onUpdate={handleAttachmentUpdate} 
                  />
                  <AttachmentUpload 
                    projectId={project.id!} 
                    onUploadSuccess={handleAttachmentUpdate} 
                  />
                </div>
              </div>
            </div>
          </form>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t flex-shrink-0">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="update-form"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Project"
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
