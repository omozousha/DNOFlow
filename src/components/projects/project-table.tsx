"use client"

import React, { useMemo, useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { WorksheetProject } from "@/types/worksheet-project"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, FileText, Archive } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

/* =======================
   Helper Components
======================= */

function TableEmpty({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        Tidak ada data project.
      </TableCell>
    </TableRow>
  )
}

function TableSkeleton({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={colSpan}>
            <Skeleton className="h-6 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

interface TableActionsProps {
  project: WorksheetProject
  onArchive?: (project: WorksheetProject) => void
  onRestore?: (project: WorksheetProject) => void
  onLogs?: (project: WorksheetProject) => void
}

function TableActions({ project, onArchive, onRestore, onLogs }: TableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onLogs?.(project)}>
          <FileText className="mr-2 h-4 w-4" />
          Logs
        </DropdownMenuItem>
        {onArchive && (
          <DropdownMenuItem onClick={() => onArchive(project)}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        {onRestore && (
          <DropdownMenuItem onClick={() => onRestore(project)}>
            <Archive className="mr-2 h-4 w-4" />
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* =======================
   Column Configuration
======================= */

const columns: {
  key: keyof WorksheetProject
  label: string
  minWidth?: number
  sticky?: boolean
  hideMobile?: boolean
  hideByDefault?: boolean
  truncate?: boolean
  sortable?: boolean
}[] = [
  { key: "no_project", label: "NO PROJECT", minWidth: 120, sticky: true, sortable: true },
  { key: "regional", label: "Regional", minWidth: 90, sortable: true },
  { key: "no_spk", label: "NO SPK", minWidth: 110, hideByDefault: true, sortable: true },
  { key: "pop", label: "POP", minWidth: 90, hideByDefault: true, sortable: true },
  { key: "nama_project", label: "Nama Project", minWidth: 200, truncate: true, sortable: true },
  { key: "port", label: "Port", minWidth: 70, hideByDefault: true, sortable: true },
  { key: "jumlah_odp", label: "Jumlah ODP", minWidth: 100, hideByDefault: true, sortable: true },
  { key: "mitra", label: "Mitra", minWidth: 110, sortable: true },
  { key: "progress", label: "Progress", minWidth: 150, sortable: true },
  { key: "toc", label: "TOC", minWidth: 100, hideByDefault: true },

  { key: "start_pekerjaan", label: "Start Pekerjaan", minWidth: 140, hideByDefault: true, hideMobile: true },
  { key: "target_active", label: "Target Active", minWidth: 140, hideByDefault: true, hideMobile: true },
  { key: "tanggal_active", label: "Tanggal Active", minWidth: 160, hideByDefault: true, hideMobile: true },
  { key: "aging_toc", label: "Aging TOC", minWidth: 120, hideByDefault: true, hideMobile: true },
  { key: "bep", label: "BEP", minWidth: 100, hideByDefault: true, hideMobile: true },
  { key: "port_terisi", label: "Port Terisi", minWidth: 120, hideByDefault: true, hideMobile: true },
  { key: "idle_port", label: "Idle Port", minWidth: 120, hideByDefault: true, hideMobile: true },
  { key: "occupancy", label: "Occupancy (%)", minWidth: 140, hideByDefault: true, hideMobile: true },
  { key: "target_bep", label: "Target BEP", minWidth: 120, hideByDefault: true, hideMobile: true },
  { key: "capex", label: "CAPEX", minWidth: 140, hideByDefault: true, hideMobile: true },
  { key: "revenue", label: "Revenue", minWidth: 140, hideByDefault: true, hideMobile: true },
  { key: "uic", label: "UIC", minWidth: 100, hideByDefault: true, hideMobile: true },
  { key: "status", label: "Status", minWidth: 120, sortable: true },
  { key: "update_progress", label: "Update Progress", minWidth: 160, hideByDefault: true, hideMobile: true },
  { key: "remark", label: "Remark", minWidth: 160, hideByDefault: true, truncate: true },
  { key: "issue", label: "Issue", minWidth: 160, truncate: true },
  { key: "next_action", label: "Next Action", minWidth: 160, hideByDefault: true, truncate: true },
  { key: "circulir_status", label: "Circulir Status", minWidth: 160, hideByDefault: true, hideMobile: true },
]

/* =======================
   Main Component
======================= */

interface ProjectTableProps {
  projects: WorksheetProject[]
  loading?: boolean
  readOnly?: boolean
  onArchive?: (project: WorksheetProject) => void
  onRestore?: (project: WorksheetProject) => void
  onLogs?: (project: WorksheetProject) => void
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  loading = false,
  readOnly = false,
  onArchive,
  onRestore,
  onLogs,
}) => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionalFilter, setRegionalFilter] = useState("all")
  const [sortKey, setSortKey] = useState<keyof WorksheetProject | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  
  // Column visibility state - load from database
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.hideByDefault).map(col => col.key as string))
  )
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load column preferences from database
  useEffect(() => {
    async function loadPreferences() {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (data?.preferences?.projectTableHiddenColumns) {
          setHiddenColumns(new Set(data.preferences.projectTableHiddenColumns));
        }
        setPreferencesLoaded(true);
      } catch (error) {
        console.error('Failed to load column preferences:', error);
        setPreferencesLoaded(true);
      }
    }

    loadPreferences();
  }, [profile?.id]);

  // Save column preferences to database
  const savePreferences = async (newHiddenColumns: Set<string>) => {
    if (!profile?.id || !preferencesLoaded) return;

    try {
      const { data: currentData } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', profile.id)
        .single();

      const currentPreferences = currentData?.preferences || {};

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPreferences,
            projectTableHiddenColumns: Array.from(newHiddenColumns)
          }
        })
        .eq('id', profile.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save column preferences:', error);
    }
  };

  /* ---------- Filtering + Sorting ---------- */
  const processedData = useMemo(() => {
    let data = [...projects]

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p =>
        [
          p.no_project,
          p.nama_project,
          p.regional,
          p.pop,
          p.mitra,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      data = data.filter(p => p.status?.toUpperCase() === statusFilter)
    }

    // Regional filter
    if (regionalFilter !== "all") {
      data = data.filter(p => p.regional?.toUpperCase() === regionalFilter)
    }

    if (sortKey) {
      data.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]
        if (aVal == null) return 1
        if (bVal == null) return -1
        if (aVal === bVal) return 0
        return sortDir === "asc"
          ? aVal > bVal ? 1 : -1
          : aVal < bVal ? 1 : -1
      })
    }

    return data
  }, [projects, search, statusFilter, regionalFilter, sortKey, sortDir])
  
  // Compute visible columns
  const visibleColumns = useMemo(() => 
    columns.filter(col => !hiddenColumns.has(col.key as string)),
    [hiddenColumns]
  )
  
  // Toggle column visibility
  const toggleColumn = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      // Save to database
      savePreferences(next);
      return next
    })
  }

  function handleSort(key: keyof WorksheetProject) {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <div className="w-full relative">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input
          placeholder="Filter project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[220px]"
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="DESAIN">DESAIN</option>
          <option value="CONSTRUCTION">CONSTRUCTION</option>
          <option value="RFS">RFS</option>
          <option value="DEPLOYMENT">DEPLOYMENT</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCEL">CANCEL</option>
        </select>

        {/* Regional Filter */}
        <select
          value={regionalFilter}
          onChange={(e) => setRegionalFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Regional</option>
          <option value="BANTEN">BANTEN</option>
          <option value="JABAR">JABAR</option>
          <option value="JABODEBEK">JABODEBEK</option>
          <option value="JATENGKAL">JATENGKAL</option>
          <option value="JATIM">JATIM</option>
          <option value="SULAWESI">SULAWESI</option>
        </select>
        
        {/* Column Visibility Toggle */}
        <details className="relative inline-block">
          <summary className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border bg-background cursor-pointer hover:bg-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Columns ({visibleColumns.length}/{columns.length})
          </summary>
          <div className="absolute left-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2 space-y-1">
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(col.key as string)}
                    onChange={() => toggleColumn(col.key as string)}
                    className="rounded"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div className="relative overflow-x-auto border rounded-md max-h-[50vh]">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 bg-muted z-20">
            <TableRow>
              <TableHead className="w-12 text-center">No</TableHead>

              {visibleColumns.map(col => (
                <TableHead
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    "whitespace-nowrap select-none",
                    col.sortable && "cursor-pointer hover:text-primary",
                    col.sticky && "sticky left-0 z-30 bg-muted shadow-right",
                    col.hideMobile && "hidden md:table-cell"
                  )}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </TableHead>
              ))}

              {!readOnly && <TableHead className="w-12 text-center">Action</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton colSpan={visibleColumns.length + (readOnly ? 1 : 2)} />
            ) : processedData.length === 0 ? (
              <TableEmpty colSpan={visibleColumns.length + (readOnly ? 1 : 2)} />
            ) : (
              processedData.map((p, i) => (
                <TableRow key={i} className="hover:bg-accent/40">
                  <TableCell className="text-center font-semibold">
                    {i + 1}
                  </TableCell>

                  {visibleColumns.map(col => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.sticky && "sticky left-0 bg-background z-20 shadow-right font-semibold",
                        col.truncate && "truncate max-w-[160px]",
                        col.hideMobile && "hidden md:table-cell"
                      )}
                    >
                      {col.key === "status" ? (
                        <Badge variant="outline">{p[col.key]}</Badge>
                      ) : col.key === "capex" || col.key === "revenue" ? (
                        `Rp ${Number(p[col.key]).toLocaleString("id-ID")}`
                      ) : col.key === "occupancy" ? (
                        `${p[col.key]}%`
                      ) : col.key === "progress" ? (
                        <Badge variant="secondary" className="text-xs">{p[col.key]}</Badge>
                      ) : (
                        p[col.key]
                      )}
                    </TableCell>
                  ))}

                  {!readOnly && (
                    <TableCell className="text-center">
                      <TableActions
                        onRestore={onRestore}
                        project={p}
                        onArchive={onArchive}
                        onLogs={onLogs}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ProjectTable
