"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Gauge,
  Calendar,
  DollarSign,
  FileText,
  Save,
  X,
  HelpCircle,
  Info,
  Loader2,
} from "lucide-react"
import { DatePicker } from "@/components/date-picker"

/* =======================
   CONSTANT DATA
======================= */

const REGIONALS = [
  "BANTEN",
  "JABAR",
  "JABODEBEK",
  "JATENGKAL",
  "JATIM",
  "SULAWESI",
]

const PROGRESS_LIST = [
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

const PROGRESS_MAPPING: Record<
  string,
  { status: string; uic: string; percentage: number }
> = {
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
}

/* =======================
   COMPONENT
======================= */

export function NewProjectForm({
  open,
  setOpen,
  onSubmit,
  initialData = {},
  loading = false,
  ...props
    // ...props (removed unused)
}: {
  open: boolean
  setOpen: (v: boolean) => void
  onSubmit: (data: any) => void // TODO: type properly
  initialData?: any // TODO: type properly
  loading?: boolean
}) {
  if (typeof setOpen !== "function") {
    throw new Error("NewProjectForm: setOpen prop is required and must be a function.");
  }
  // Get logged-in user profile (for division/organization_id)
  const { profile } = useAuth();
  // Controlled form state for all fields
  const [regional, setRegional] = useState(initialData.regional || "");
  const [pop, setPop] = useState(initialData.pop || "");
  const [no_project, setNoProject] = useState(initialData.no_project || "");
  const [no_spk, setNoSpk] = useState(initialData.no_spk || "");
  const [nama_project, setNamaProject] = useState(initialData.nama_project || "");
  const [mitra, setMitra] = useState(initialData.mitra || "");
  const [port, setPort] = useState(Number(initialData.port) || 0);
  const [jumlah_odp, setJumlahOdp] = useState(Number(initialData.jumlah_odp) || 0);
  const [portTerisi, setPortTerisi] = useState(Number(initialData.port_terisi) || 0);
  const [progress, setProgress] = useState(initialData.progress || "");
  
  // Date fields - convert string to Date
  const [start_pekerjaan, setStartPekerjaan] = useState<Date | undefined>(
    initialData.start_pekerjaan ? new Date(initialData.start_pekerjaan) : undefined
  );
  const [target_active, setTargetActive] = useState<Date | undefined>(
    initialData.target_active ? new Date(initialData.target_active) : undefined
  );
  const [tanggal_active, setTanggalActive] = useState<Date | undefined>(
    initialData.tanggal_active ? new Date(initialData.tanggal_active) : undefined
  );
  const [aging_toc, setAgingToc] = useState<Date | undefined>(
    initialData.aging_toc ? new Date(initialData.aging_toc) : undefined
  );
  const [target_bep, setTargetBep] = useState<Date | undefined>(
    initialData.target_bep ? new Date(initialData.target_bep) : undefined
  );
  
  // Number fields
  const [toc, setToc] = useState(Number(initialData.toc) || 0);
  const [bep, setBep] = useState(Number(initialData.bep) || 0);
  
  // Auto-fill dengan current datetime jika tidak ada initialData
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const [update_progress, setUpdateProgress] = useState(
    initialData.update_progress 
      ? new Date(initialData.update_progress).toISOString().slice(0, 16) 
      : getCurrentDateTimeLocal()
  );
  const [revenue, setRevenue] = useState(initialData.revenue || "");
  const [remark, setRemark] = useState(initialData.remark || "");
  const [issue, setIssue] = useState(initialData.issue || "");
  const [next_action, setNextAction] = useState(initialData.next_action || "");
  const [circulir_status, setCirculirStatus] = useState(initialData.circulir_status || "ongoing");

  // Derived fields
  const [status, setStatus] = useState(initialData.status || "");
  const [uic, setUic] = useState(initialData.uic || "");
  const [persentase, setPersentase] = useState(initialData.persentase || "0");
  const [occupancy, setOccupancy] = useState(initialData.occupancy || "0%");
  const [capex, setCapex] = useState(initialData.capex || "Rp 0");

  useEffect(() => {
    const key = progress;
    if (PROGRESS_MAPPING[key]) {
      setStatus(PROGRESS_MAPPING[key].status);
      setUic(PROGRESS_MAPPING[key].uic);
      setPersentase(PROGRESS_MAPPING[key].percentage.toString());
    }
  }, [progress]);

  // Determine allowed progress options based on user division
  let allowedProgress = [] as string[];
  if (profile?.division === "PLANNING") {
    allowedProgress = PLANNING_PROGRESS;
  } else if (profile?.division === "DEPLOYMENT") {
    allowedProgress = DEPLOYMENT_PROGRESS;
  } else {
    allowedProgress = [];
  }

  useEffect(() => {
    if (port <= 0) {
      setOccupancy("0%");
      return;
    }
    const val = ((portTerisi / port) * 100).toFixed(2);
    setOccupancy(`${val}%`);
  }, [port, portTerisi]);

  useEffect(() => {
    const total = port * 850_000;
    setCapex(
      "Rp " +
        total.toLocaleString("id-ID", {
          maximumFractionDigits: 0,
        })
    );
  }, [port]);

  // Handle submit
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Helper to convert Date to ISO string or null
    function dateToISO(date?: Date) {
      return date ? date.toISOString().split('T')[0] : null;
    }
    
    // Calculate derived fields
    const portNum = parseInt(port?.toString() || "0");
    const portTerisiNum = parseInt(portTerisi?.toString() || "0");
    const idlePortNum = Math.max(portNum - portTerisiNum, 0);
    const occupancyNum = portNum > 0 ? Math.round((portTerisiNum / portNum) * 100) : 0;
    const revenueNum = parseFloat(revenue?.toString() || "0");
    const capexNum = revenueNum * 0.6;
    
    // Inject organization_id or division from profile (controller)
    const data = {
      regional,
      pop,
      no_project,
      no_spk,
      nama_project,
      mitra,
      port: portNum.toString(),
      jumlah_odp: jumlah_odp?.toString() || null,
      port_terisi: portTerisiNum.toString(),
      // idle_port: excluded - auto-calculated by database (GENERATED ALWAYS column)
      occupancy: occupancyNum.toString(),
      progress,
      start_pekerjaan: dateToISO(start_pekerjaan),
      target_active: dateToISO(target_active),
      tanggal_active: dateToISO(tanggal_active),
      aging_toc: dateToISO(aging_toc),
      toc: toc?.toString() || null,
      update_progress: new Date().toISOString(),
      bep: bep?.toString() || null,
      target_bep: dateToISO(target_bep),
      capex: capexNum.toString(),
      revenue: revenueNum.toString(),
      uic,
      status,
      persentase,
      remark: remark || null,
      issue: issue || null,
      next_action: next_action || null,
      circulir_status: circulir_status || null,
      // Add organization_id or division from profile if available
      ...(profile?.organization_id && { organization_id: profile.organization_id }),
      ...(profile?.division && { division: profile.division }),
    };
    onSubmit(data);
  }

  // Keyboard shortcut handler (Ctrl+S)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleFormSubmit(e as any);
      }
    }
    
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, regional, pop, no_project, nama_project, port, progress]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="max-w-7xl w-[95vw] sm:w-[90vw] lg:w-[85vw] p-0 mx-auto">
        <ScrollArea className="h-[100vh]">
          <DrawerHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DrawerTitle className="text-2xl font-bold flex items-center gap-2">
                  {initialData?.id ? "Edit Project" : "Add New Project"}
                  <Badge variant="outline" className="ml-2">
                    {profile?.division || "Controller"}
                  </Badge>
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  {initialData?.id 
                    ? "Update project information and progress" 
                    : "Lengkapi informasi project untuk memulai tracking"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" type="button">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Field dengan tanda <span className="text-red-500">*</span> wajib diisi. Field dengan badge "Auto" akan dihitung otomatis.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerHeader>
          <form className="space-y-6 px-6 py-6 pb-24" onSubmit={handleFormSubmit}>
            {/* IDENTITAS */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Identitas Project</CardTitle>
                </div>
                <CardDescription>Informasi dasar dan identifikasi project (6 fields)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Regional" required>
                  <Select value={regional} onValueChange={setRegional}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih regional" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONALS.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="POP" required>
                  <Input maxLength={20} value={pop} onChange={e => setPop(e.target.value)} placeholder="Contoh: POP-001" />
                </Field>
                <Field label="No Project" required>
                  <Input maxLength={20} value={no_project} onChange={e => setNoProject(e.target.value)} placeholder="Contoh: PRJ-2026-001" />
                </Field>
                <Field label="No SPK">
                  <Input maxLength={50} value={no_spk} onChange={e => setNoSpk(e.target.value)} placeholder="Nomor SPK" />
                </Field>
                <Field label="Nama Project" required span="col-span-full">
                  <Input value={nama_project} onChange={e => setNamaProject(e.target.value)} placeholder="Nama lengkap project" />
                </Field>
                <Field label="Mitra" span="col-span-full">
                  <Input value={mitra} onChange={e => setMitra(e.target.value)} placeholder="Nama mitra kerja" />
                </Field>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* KAPASITAS */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  <CardTitle>Kapasitas</CardTitle>
                </div>
                <CardDescription>Informasi port, ODP, dan occupancy (5 fields, 2 auto-calculated)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Port">
                  <Input type="number" value={port} onChange={e => setPort(+e.target.value)} placeholder="Jumlah total port" />
                </Field>
                <Field label="Jumlah ODP">
                  <Input type="number" value={jumlah_odp} onChange={e => setJumlahOdp(+e.target.value)} placeholder="Jumlah ODP" />
                </Field>
                <Field label="Port Terisi">
                  <Input type="number" value={portTerisi} onChange={e => setPortTerisi(+e.target.value)} placeholder="Port yang sudah terisi" />
                </Field>
                <Field label="Idle Port" badge="Auto">
                  <Input readOnly value={Math.max(port - portTerisi, 0)} className="bg-muted cursor-not-allowed" />
                </Field>
                <Field label="Occupancy %" badge="Auto">
                  <Input readOnly value={occupancy} className="bg-muted cursor-not-allowed" />
                </Field>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* TIMELINE */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Timeline & Progress</CardTitle>
                </div>
                <CardDescription>Jadwal dan progress pekerjaan (7 fields)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Restriction Alert */}
                {allowedProgress.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Progress task tidak tersedia. Pastikan Anda memiliki role PLANNING atau DEPLOYMENT.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Progress Task" span="col-span-full">
                    <Select value={progress} onValueChange={setProgress} disabled={allowedProgress.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={allowedProgress.length === 0 ? "Tidak diizinkan" : "Pilih progress"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedProgress.map(p => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  
                  <Field label="Start Pekerjaan">
                    <DatePicker 
                      value={start_pekerjaan} 
                      onChange={setStartPekerjaan}
                      placeholder="Pilih tanggal start"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="TOC">
                    <Input 
                      type="number" 
                      value={toc} 
                      onChange={e => setToc(+e.target.value)}
                      placeholder="Jumlah hari pekerjaan dilapangan"
                    />
                  </Field>
                  <Field label="Aging TOC">
                    <DatePicker 
                      value={aging_toc} 
                      onChange={setAgingToc}
                      placeholder="Pilih tanggal aging TOC"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Target Active">
                    <DatePicker 
                      value={target_active} 
                      onChange={setTargetActive}
                      placeholder="Pilih target active"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Tanggal Active (RFS)" span="col-span-full">
                    <DatePicker 
                      value={tanggal_active} 
                      onChange={setTanggalActive}
                      placeholder="Pilih tanggal active"
                      locale="id-ID"
                    />
                  </Field>
                  <Field label="Update Progress" span="col-span-full">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="datetime-local" 
                        value={update_progress} 
                        onChange={e => setUpdateProgress(e.target.value)} 
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUpdateProgress(getCurrentDateTimeLocal())}
                      >
                        Now
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Otomatis terisi tanggal dan jam saat ini. Klik "Now" untuk update.</p>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* FINANSIAL */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle>Finansial & Status</CardTitle>
                </div>
                <CardDescription>Data finansial dan status project (6 fields, 3 auto-calculated)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="BEP">
                  <Input 
                    type="number" 
                    value={bep} 
                    onChange={e => setBep(+e.target.value)} 
                    placeholder="Jumlah berapa bulan biaya investasi akan balik" 
                  />
                </Field>
                <Field label="Target BEP">
                  <DatePicker 
                    value={target_bep} 
                    onChange={setTargetBep}
                    placeholder="Pilih target BEP"
                    locale="id-ID"
                  />
                </Field>
                <Field label="CAPEX" badge="Auto">
                  <Input readOnly value={capex} className="bg-muted cursor-not-allowed" />
                </Field>
                <Field label="Revenue">
                  <Input value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="Total revenue" />
                </Field>
                <Field label="UIC" badge="Auto">
                  <Input readOnly value={uic} className="bg-muted cursor-not-allowed" />
                </Field>
                <Field label="Status" badge="Auto">
                  <Input readOnly value={status} className="bg-muted cursor-not-allowed" />
                </Field>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* CATATAN */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Catatan</CardTitle>
                </div>
                <CardDescription>Remark, issue, next action, dan circulir status (4 fields, optional)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <Field label="Remark">
                  <Textarea 
                    value={remark} 
                    onChange={e => setRemark(e.target.value)} 
                    placeholder="Catatan umum tentang project..."
                    rows={3}
                  />
                </Field>
                <Field label="Issue">
                  <Textarea 
                    value={issue} 
                    onChange={e => setIssue(e.target.value)} 
                    placeholder="Kendala atau masalah yang dihadapi..."
                    rows={3}
                  />
                </Field>
                <Field label="Next Action">
                  <Textarea 
                    value={next_action} 
                    onChange={e => setNextAction(e.target.value)} 
                    placeholder="Langkah selanjutnya yang perlu dilakukan..."
                    rows={3}
                  />
                </Field>
                <Field label="Circulir Status" badge="Auto">
                  <Select value={circulir_status} onValueChange={setCirculirStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>

            {/* Sticky Footer dengan Buttons */}
            <div className="fixed bottom-0 right-0 w-full max-w-3xl bg-background border-t px-6 py-4 flex justify-between items-center gap-4 z-10">
              <div className="text-sm text-muted-foreground">
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs bg-muted rounded">S</kbd> untuk save cepat
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Project
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

/* =======================
   HELPER
======================= */

function Field({
  label,
  span = '',
  required = false,
  badge = null,
  children,
}: {
  label: string
  span?: string
  required?: boolean
  badge?: string | null
  children: React.ReactNode
}) {
  return (
    <div className={typeof span === 'string' && span ? span : 'col-span-1'}>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="font-medium text-sm text-muted-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-base">*</span>}
        </Label>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}
