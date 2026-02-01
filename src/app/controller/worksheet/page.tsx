"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { WorksheetProject } from "@/types/worksheet-project";
import * as XLSX from "xlsx";
import { NewProjectForm } from "@/components/worksheet/new-project-form";
import { ProjectCard } from "@/components/worksheet/project-card";
import { ProjectCardSkeletonGrid } from "@/components/worksheet/project-card-skeleton";
import { UpdateProjectDrawer } from "@/components/worksheet/update-project-drawer";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  XCircle,
  PlayCircle,
  Search,
  
} from "lucide-react";
import { cn } from "@/lib/utils";

// Status mapping - same as controller dashboard for consistency
const statusKeyMap: Record<string, string> = {
  'total': 'total',
  'rescheduled': 'rescheduled',
  'cancel': 'cancel',
  'done': 'done',
  'construction': 'construction',
  'ny_construction': 'ny_construction',
  'pending 2026': 'rescheduled',
  'pending': 'rescheduled',
  'canceled': 'cancel',
  'archived': 'cancel',
  'finished': 'done',
  'completed': 'done',
  'in progress': 'construction',
  'not yet construction': 'ny_construction',
  'ny construction': 'ny_construction',
  // Map from status field values
  'desain': 'ny_construction',
  'planning': 'ny_construction',
  'deployment': 'done',
  'rfs': 'construction',
  // Map from specific progress values
  '18. done': 'done',
  'reject': 'cancel',
};

// Helper function to normalize status/progress values
function getStatusCategory(project: WorksheetProject): string {
  // Check progress field first (more specific)
  if (project.progress) {
    const progressLower = project.progress.toLowerCase().trim();
    if (statusKeyMap[progressLower]) {
      return statusKeyMap[progressLower];
    }
    // Check if it contains key parts
    if (progressLower.includes('done')) return 'done';
    if (progressLower.includes('reject')) return 'cancel';
  }
  
  // Check status field
  if (project.status) {
    const statusLower = project.status.toLowerCase().trim();
    if (statusKeyMap[statusLower]) {
      return statusKeyMap[statusLower];
    }
    if (statusLower.includes('construction')) return 'construction';
    if (statusLower.includes('cancel')) return 'cancel';
    if (statusLower === 'desain' || statusLower === 'planning') return 'ny_construction';
    if (statusLower === 'rfs') return 'construction';
    if (statusLower === 'deployment') return 'done';
  }
  
  // Check uic field as fallback
  if (project.uic) {
    const uicLower = project.uic.toLowerCase().trim();
    if (uicLower === 'planning') return 'ny_construction';
    if (uicLower === 'deployment') return 'construction';
  }
  
  // Default to ny_construction for unknown
  return 'ny_construction';
}

// Helper component for metric cards
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  variant?: "default" | "success" | "warning" | "info";
}

function MetricCard({ icon, title, value, description, variant = "default" }: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20",
    info: "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20",
  };

  return (
    <Card className={cn(variantStyles[variant], "h-full")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-background rounded-lg">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <div className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Helper component for status items in distribution card
interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  ports: number;
}

function StatusItem({ icon, label, value, total, ports }: StatusItemProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <div className="text-right">
          <span className="font-semibold">{value}</span>
          <span className="text-muted-foreground text-xs ml-1">({ports} ports)</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="h-2" />
        <span className="text-xs text-muted-foreground min-w-[3rem] text-right">{percentage}%</span>
      </div>
    </div>
  );
}

export default function ControllerWorksheetPage() {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [projects, setProjects] = useState<WorksheetProject[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Update progress dialog
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<WorksheetProject | null>(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionalFilter, setRegionalFilter] = useState("all");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq('is_archived', false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setProjects([]);
      console.error("Failed to fetch projects:", message);
      toast.error("Gagal memuat data project");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();

    // Setup real-time subscription for projects
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: 'is_archived=eq.false'
        },
        (payload) => {
          console.log('Project change detected:', payload);
          // Refetch projects when any change occurs
          fetchProjects();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  async function handleUpdateProgress(project: WorksheetProject) {
    setSelectedProject(project);
    setUpdateDialog(true);
  }

  async function handleUpdateSuccess() {
    // Refetch projects after update
    await fetchProjects();
    toast.success("Data berhasil di-refresh");
  }

  async function handleSubmit(data: WorksheetProject) {
    setFormLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert([data])
        .select("id")
        .single();
      
      if (insertError) {
        toast.error("Gagal menyimpan project: " + insertError.message);
      } else {
        toast.success("Project berhasil disimpan");
        
        // Log the create action (optional - don't fail if logging fails)
        if (inserted?.id) {
          try {
            await supabase.from('project_logs').insert({
              project_id: inserted.id,
              action: 'created',
              field_changed: null,
              old_value: null,
              new_value: null,
              changed_by: userId,
              metadata: {
                project_name: data.nama_project,
                no_project: data.no_project,
                regional: data.regional,
              }
            });
          } catch (logException) {
            console.warn('Failed to log create action:', logException);
          }
        }
        
        // Auto-refresh data
        await fetchProjects();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Terjadi kesalahan saat menyimpan project");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) { 
          setImportLoading(false); 
          return; 
        }
        const wb = XLSX.read(bstr, { type: "binary" });
        
        // Try to find "Data" sheet, fallback to first sheet
        let wsname = wb.SheetNames.find(name => 
          name.toLowerCase() === 'data' || 
          name.toLowerCase() === 'sheet1' ||
          name.toLowerCase().includes('data')
        );
        
        // If no "Data" sheet found, use first non-panduan sheet
        if (!wsname) {
          wsname = wb.SheetNames.find(name => 
            !name.toLowerCase().includes('panduan') && 
            !name.toLowerCase().includes('guide') &&
            !name.toLowerCase().includes('instruksi')
          ) || wb.SheetNames[0];
        }
        
        console.log(`[Import] Reading sheet: "${wsname}" from available sheets:`, wb.SheetNames);
        
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        // Constants for validation
        const VALID_REGIONALS = ["BANTEN", "JABAR", "JABODEBEK", "JATENGKAL", "JATIM", "SULAWESI"];
        const VALID_PROGRESS = [
          "REJECT", "PENDING / HOLD",
          "CREATED BOQ", "CHECKED BOQ", "BEP", "APPROVED", "SPK SURVEY", "SURVEY", "DRM", "APPROVED BOQ DRM", "SPK",
          "MOS", "PERIZINAN", "CONST", "COMMTEST", "UT", "REKON", "BAST", "BALOP", "DONE"
        ];
        const VALID_CIRCULIR_STATUS = ["ongoing", "hold", "reject"];
        
        // Progress aliases - map common variations to valid progress
        const PROGRESS_ALIASES: Record<string, string> = {
          "HOLD": "PENDING / HOLD",
          "PENDING": "PENDING / HOLD",
          "CANCEL": "REJECT",
          "CANCELLED": "REJECT",
          "CANCELED": "REJECT",
          "RFS": "REKON",
          "READY FOR SERVICE": "REKON",
          "CONSTRUCTION": "CONST",
          "COMPLETE": "DONE",
          "COMPLETED": "DONE",
          "FINISH": "DONE",
          "FINISHED": "DONE",
          "DEPLOYMENT": "DONE",
        };
        
        // Helper: Find closest match for suggestions
        const findClosestMatch = (input: string, validList: string[]): string | null => {
          const inputLower = input.toLowerCase();
          // Exact partial match
          const partial = validList.find(v => v.toLowerCase().includes(inputLower) || inputLower.includes(v.toLowerCase()));
          if (partial) return partial;
          // Check if any valid option starts with input
          const startsWith = validList.find(v => v.toLowerCase().startsWith(inputLower));
          if (startsWith) return startsWith;
          return null;
        };
        
        // Progress mapping for auto-calculate status/uic/percentage
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
        
        // Get current user profile for division check
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from("profiles")
          .select("division")
          .eq("id", user?.id)
          .single();
        
        const userDivision = profileData?.division;

        type ImportRow = {
          regional?: string;
          no_project?: string;
          nama_project?: string;
          pop?: string;
          progress?: string;
          port?: string | number;
          port_terisi?: string | number;
          revenue?: string | number;
          remark?: string;
          issue?: string;
          next_action?: string;
          circulir_status?: string;
          [key: string]: unknown;
        };
        
        // Process and validate each row
        const errors: string[] = [];
        const mapped = (Array.isArray(data) ? (data as ImportRow[]) : []).map((row, index: number) => {
          const rowNum = index + 2; // Excel row number (header is row 1)
          
          // Validasi field wajib (hanya 4 field: regional, no_project, nama_project, pop)
          if (!row.regional) errors.push(`Baris ${rowNum}: Regional wajib diisi`);
          if (!row.no_project) errors.push(`Baris ${rowNum}: No Project wajib diisi`);
          if (!row.nama_project) errors.push(`Baris ${rowNum}: Nama Project wajib diisi`);
          if (!row.pop) errors.push(`Baris ${rowNum}: POP wajib diisi`);
          
          // Normalisasi dan validasi regional
          if (row.regional) {
            // Normalize: remove numbers and dots from the beginning, then uppercase
            const normalizedRegional = row.regional.trim().replace(/^\d+\.?\s*/, '').trim().toUpperCase();
            console.log(`[Import] Baris ${rowNum}: Regional original="${row.regional}" → normalized="${normalizedRegional}"`);
            
            if (!VALID_REGIONALS.includes(normalizedRegional)) {
              errors.push(`Baris ${rowNum}: Regional tidak valid "${normalizedRegional}". Harus salah satu dari: ${VALID_REGIONALS.join(", ")}`);
            } else {
              row.regional = normalizedRegional;
            }
          }
          
          // Validasi progress (optional, tapi jika diisi harus valid)
          if (row.progress && row.progress.trim() !== '') {
            // Normalize: remove numbers, dots, spaces from the beginning, trim whitespace
            // Handles: "18. BAST", "18.BAST", "18 BAST", " BAST ", etc.
            let normalizedProgress = String(row.progress)
              .trim()
              .replace(/^\d+\.?\s*/, '') // Remove "18." or "18 " or "18" from start
              .trim()
              .toUpperCase();
            
            // Additional cleanup: remove extra spaces
            normalizedProgress = normalizedProgress.replace(/\s+/g, ' ');
            
            // Check if it's an alias and map to valid progress
            if (PROGRESS_ALIASES[normalizedProgress]) {
              console.log(`[Import] Baris ${rowNum}: Progress "${normalizedProgress}" → mapped to "${PROGRESS_ALIASES[normalizedProgress]}"`);
              normalizedProgress = PROGRESS_ALIASES[normalizedProgress];
            }
            
            console.log(`[Import] Baris ${rowNum}: Progress original="${row.progress}" → normalized="${normalizedProgress}"`);
            
            if (!VALID_PROGRESS.includes(normalizedProgress)) {
              const suggestion = findClosestMatch(normalizedProgress, VALID_PROGRESS);
              const errorMsg = suggestion 
                ? `Baris ${rowNum}: Progress tidak valid "${normalizedProgress}". Mungkin maksud Anda: "${suggestion}"?`
                : `Baris ${rowNum}: Progress tidak valid "${normalizedProgress}". Gunakan salah satu: REJECT, PENDING / HOLD, CREATED BOQ, CHECKED BOQ, BEP, APPROVED, SPK SURVEY, SURVEY, DRM, APPROVED BOQ DRM, SPK, MOS, PERIZINAN, CONST, COMMTEST, UT, REKON, BAST, BALOP, DONE (atau alias: HOLD, PENDING, CANCEL, RFS, CONSTRUCTION, dll)`;
              errors.push(errorMsg);
            } else {
              // Update row with normalized progress
              row.progress = normalizedProgress;
            }
          }
          
          // Normalisasi dan validasi circulir_status
          if (row.circulir_status) {
            // Normalize: remove numbers and dots from the beginning, then lowercase
            const normalizedStatus = row.circulir_status.trim().replace(/^\d+\.?\s*/, '').trim().toLowerCase();
            console.log(`[Import] Baris ${rowNum}: Circulir Status original="${row.circulir_status}" → normalized="${normalizedStatus}"`);
            
            if (!VALID_CIRCULIR_STATUS.includes(normalizedStatus)) {
              errors.push(`Baris ${rowNum}: Circulir Status tidak valid "${normalizedStatus}". Harus salah satu dari: ongoing, hold, reject`);
            } else {
              row.circulir_status = normalizedStatus;
            }
          }
          
          // Validasi tipe data number
          if (row.port && isNaN(Number(row.port))) {
            errors.push(`Baris ${rowNum}: Port harus berupa angka`);
          }
          if (row.jumlah_odp && isNaN(Number(row.jumlah_odp))) {
            errors.push(`Baris ${rowNum}: Jumlah ODP harus berupa angka`);
          }
          if (row.port_terisi && isNaN(Number(row.port_terisi))) {
            errors.push(`Baris ${rowNum}: Port Terisi harus berupa angka`);
          }
          if (row.toc && isNaN(Number(row.toc))) {
            errors.push(`Baris ${rowNum}: TOC harus berupa angka (hari)`);
          }
          if (row.bep && isNaN(Number(row.bep))) {
            errors.push(`Baris ${rowNum}: BEP harus berupa angka (bulan)`);
          }
          
          // Division-based validation
          const progressKey = row.progress ?? "";
          const mapping = PROGRESS_MAPPING[progressKey];
          if (userDivision === "PLANNING" && mapping?.uic === "DEPLOYMENT") {
            errors.push(`Baris ${rowNum}: User PLANNING tidak boleh import project dengan progress DEPLOYMENT`);
          }
          if (userDivision === "DEPLOYMENT" && mapping?.uic === "PLANNING") {
            errors.push(`Baris ${rowNum}: User DEPLOYMENT tidak boleh import project dengan progress PLANNING`);
          }
          
          // Auto-calculate status, uic, percentage, capex, occupancy
          // Note: idle_port is auto-calculated by database (GENERATED ALWAYS column)
          const autoFields = PROGRESS_MAPPING[progressKey] || { status: "PENDING", uic: "PLANNING & DEPLOYMENT", percentage: 0 };
          
          const port = Number(row.port) || 0;
          const port_terisi = Number(row.port_terisi) || 0;
          // idle_port excluded - auto-calculated by database
          const occupancy = port > 0 ? Math.round((port_terisi / port) * 100) : 0;
          const revenue = Number(row.revenue) || 0;
          const capex = revenue * 0.6;
          
          // Helper to format date from Excel (if needed)
          function formatDate(value: unknown) {
            if (!value) return null;
            if (typeof value === 'string') {
              // Already a string date, ensure it's YYYY-MM-DD format
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
              return value;
            }
            // Excel serial date number
            if (typeof value === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + value * 86400000);
              return date.toISOString().split('T')[0];
            }
            return null;
          }
          
          // Build project object
          return {
            regional: row.regional?.toUpperCase() || "",
            no_project: row.no_project || "",
            no_spk: row.no_spk || null,
            pop: row.pop || "",
            nama_project: row.nama_project || "",
            port: port.toString(),
            jumlah_odp: (Number(row.jumlah_odp) || 0).toString(),
            mitra: row.mitra || null,
            progress: row.progress || "",
            toc: (Number(row.toc) || 0).toString(),
            start_pekerjaan: formatDate(row.start_pekerjaan),
            target_active: formatDate(row.target_active),
            tanggal_active: formatDate(row.tanggal_active),
            aging_toc: formatDate(row.aging_toc),
            bep: (Number(row.bep) || 0).toString(),
            port_terisi: port_terisi.toString(),
            // idle_port: excluded - auto-calculated by database (GENERATED ALWAYS column)
            occupancy: occupancy.toString(),
            target_bep: formatDate(row.target_bep),
            capex: capex.toString(),
            revenue: revenue.toString(),
            uic: autoFields.uic,
            status: autoFields.status,
            persentase: autoFields.percentage.toString(),
            update_progress: new Date().toISOString(),
            remark: row.remark || null,
            issue: row.issue || null,
            next_action: row.next_action || null,
            circulir_status: row.circulir_status?.toLowerCase() || null,
            division: userDivision,
          };
        }).filter(row => row.no_project && row.nama_project);
        
        // Show errors if any
        if (errors.length > 0) {
          toast.error(`Validasi gagal:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n... dan ${errors.length - 5} error lainnya` : ""}`);
          setImportLoading(false);
          return;
        }
        
        if (mapped.length === 0) {
          toast.error("Data import tidak valid atau kosong. Pastikan format kolom sudah benar.");
          setImportLoading(false);
          return;
        }
        
        // Bulk insert to database
        const { error: insertError } = await supabase
          .from("projects")
          .insert(mapped)
          .select();
        
        if (insertError) {
          toast.error("Gagal menyimpan data: " + insertError.message);
        } else {
          toast.success(`Berhasil import ${mapped.length} project ke database`);
          // Auto-refresh data
          await fetchProjects();
          setImportDialog(false);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error("Error saat import: " + message);
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projects.length;
    
    // Categorize projects by status
    const categorizedProjects = projects.map(p => ({
      ...p,
      category: getStatusCategory(p)
    }));
    
    // Count by category
    const doneCount = categorizedProjects.filter(p => p.category === 'done').length;
    const constructionCount = categorizedProjects.filter(p => p.category === 'construction').length;
    const nyConstructionCount = categorizedProjects.filter(p => p.category === 'ny_construction').length;
    const rescheduledCount = categorizedProjects.filter(p => p.category === 'rescheduled').length;
    const cancelCount = categorizedProjects.filter(p => p.category === 'cancel').length;
    
    // Active projects = total - cancelled
    const activeProjects = total - cancelCount;
    const completedProjects = doneCount;
    const progressRate = total > 0 ? Math.round((completedProjects / total) * 100) : 0;

    // Regional breakdown
    const luwukProjects = projects.filter(p => 
      p.regional?.toLowerCase().includes("luwuk")
    ).length;
    const makassarProjects = projects.filter(p => 
      p.regional?.toLowerCase().includes("makassar")
    ).length;

    // Port calculations by category
    const totalPorts = projects.reduce((sum, p) => sum + (Number(p.port) || 0), 0);
    const donePorts = categorizedProjects
      .filter(p => p.category === 'done')
      .reduce((sum, p) => sum + (Number(p.port) || 0), 0);
    const constructionPorts = categorizedProjects
      .filter(p => p.category === 'construction')
      .reduce((sum, p) => sum + (Number(p.port) || 0), 0);
    const nyConstructionPorts = categorizedProjects
      .filter(p => p.category === 'ny_construction')
      .reduce((sum, p) => sum + (Number(p.port) || 0), 0);
    const rescheduledPorts = categorizedProjects
      .filter(p => p.category === 'rescheduled')
      .reduce((sum, p) => sum + (Number(p.port) || 0), 0);
    const cancelPorts = categorizedProjects
      .filter(p => p.category === 'cancel')
      .reduce((sum, p) => sum + (Number(p.port) || 0), 0);

    return {
      total,
      activeProjects,
      completedProjects,
      progressRate,
      doneCount,
      constructionCount,
      nyConstructionCount,
      rescheduledCount,
      cancelCount,
      luwukProjects,
      makassarProjects,
      totalPorts,
      donePorts,
      constructionPorts,
      nyConstructionPorts,
      rescheduledPorts,
      cancelPorts,
    };
  }, [projects]);

  // Filtered projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          project.nama_project?.toLowerCase().includes(search) ||
          project.no_project?.toLowerCase().includes(search) ||
          project.pop?.toLowerCase().includes(search) ||
          project.mitra?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== "all") {
        const category = getStatusCategory(project);
        if (category !== statusFilter) return false;
      }
      
      // Regional filter
      if (regionalFilter !== "all") {
        if (project.regional?.toUpperCase() !== regionalFilter.toUpperCase()) return false;
      }
      
      return true;
    });
  }, [projects, searchTerm, statusFilter, regionalFilter]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Project Worksheet</h1>
        <p className="text-sm text-muted-foreground">
          Kelola data project secara menyeluruh dengan fitur CRUD dan import Excel
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setOpen(true)} className="h-9">
          Add New Project
        </Button>
        <Button variant="secondary" onClick={() => setImportDialog(true)} className="h-9">
          Import Excel
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
          title="Total Projects"
          value={stats.total}
          description="Seluruh project dalam sistem"
          variant="info"
        />
        <MetricCard
          icon={<PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
          title="Active Projects"
          value={stats.activeProjects}
          description="Project yang sedang berjalan"
          variant="warning"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
          title="Completed"
          value={stats.completedProjects}
          description="Project yang sudah selesai"
          variant="success"
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
          title="Progress Rate"
          value={`${stats.progressRate}%`}
          description="Tingkat penyelesaian project"
          variant="default"
        />
      </div>

      {/* Project Status Distribution */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <CardTitle className="text-base sm:text-lg">Project Status</CardTitle>
          </div>
          <CardDescription className="text-xs">Distribusi status project berdasarkan progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusItem
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            label="Done"
            value={stats.doneCount}
            total={stats.total}
            ports={stats.donePorts}
          />
          <StatusItem
            icon={<PlayCircle className="h-4 w-4 text-blue-600" />}
            label="Construction"
            value={stats.constructionCount}
            total={stats.total}
            ports={stats.constructionPorts}
          />
          <StatusItem
            icon={<Clock className="h-4 w-4 text-orange-600" />}
            label="NY Construction"
            value={stats.nyConstructionCount}
            total={stats.total}
            ports={stats.nyConstructionPorts}
          />
          <StatusItem
            icon={<AlertCircle className="h-4 w-4 text-yellow-600" />}
            label="Rescheduled"
            value={stats.rescheduledCount}
            total={stats.total}
            ports={stats.rescheduledPorts}
          />
          <StatusItem
            icon={<XCircle className="h-4 w-4 text-red-600" />}
            label="Cancelled"
            value={stats.cancelCount}
            total={stats.total}
            ports={stats.cancelPorts}
          />
        </CardContent>
      </Card>

      {/* Project Cards Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg">All Projects</CardTitle>
              <CardDescription className="text-xs">Klik card untuk update progress</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">{filteredProjects.length} projects</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="done">Done</option>
              <option value="construction">Construction</option>
              <option value="ny_construction">NY Construction</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancel">Cancelled</option>
            </select>
            
            <select
              value={regionalFilter}
              onChange={(e) => setRegionalFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:col-span-2 lg:col-span-1"
            >
              <option value="all">All Regional</option>
              <option value="BANTEN">BANTEN</option>
              <option value="JABAR">JABAR</option>
              <option value="JABODEBEK">JABODEBEK</option>
              <option value="JATENGKAL">JATENGKAL</option>
              <option value="JATIM">JATIM</option>
              <option value="SULAWESI">SULAWESI</option>
            </select>
          </div>

          {/* Project Cards Grid */}
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <ProjectCardSkeletonGrid count={8} />
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || regionalFilter !== "all" 
                  ? "No projects match your filters"
                  : "No projects yet. Add your first project!"}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUpdateProgress={handleUpdateProgress}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Update Project Drawer */}
      <UpdateProjectDrawer
        open={updateDialog}
        setOpen={setUpdateDialog}
        project={selectedProject}
        onSuccess={handleUpdateSuccess}
      />

      {/* Import Dialog */}
      {importDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 8l-3-3m3 3l3-3m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Import Data Project (Excel)
              </CardTitle>
              <CardDescription>Upload file Excel dengan format yang sesuai</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="mb-4 block w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={importLoading}
              />
              {importLoading && (
                <div className="flex items-center gap-2 mb-2">
                  <LoadingSpinner size="sm" text="Mengimpor data..." />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setImportDialog(false)} disabled={importLoading}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add New Project Dialog */}
      <NewProjectForm open={open} setOpen={setOpen} onSubmit={handleSubmit} loading={formLoading} />
    </div>
  );
}