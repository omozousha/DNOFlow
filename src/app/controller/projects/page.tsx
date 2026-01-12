"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProjectTable from "@/components/projects/project-table";
import { ProjectLogsDialog } from "@/components/projects/project-logs-dialog";
import { ArchiveProjectDialog } from "@/components/projects/archive-project-dialog";
import { RestoreProjectDialog } from "@/components/projects/restore-project-dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { WorksheetProject } from "@/types/worksheet-project";
import { FolderOpen, Archive as ArchiveIcon, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ControllerProjectsPage() {
  const [projects, setProjects] = useState<WorksheetProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Dialog states
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<WorksheetProject | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Handlers for dropdown actions
  const handleLogs = (project: WorksheetProject) => {
    setSelectedProject(project);
    setLogsDialogOpen(true);
  };

  const handleArchive = (project: WorksheetProject) => {
    setSelectedProject(project);
    setArchiveDialogOpen(true);
  };

  const handleRestore = (project: WorksheetProject) => {
    setSelectedProject(project);
    setRestoreDialogOpen(true);
  };

  const handleArchiveSuccess = () => {
    fetchProjects(); // Refresh list
  };

  const handleRestoreSuccess = () => {
    fetchProjects(); // Refresh list
  };

  // Export to Excel
  const handleExport = (type: 'current' | 'all') => {
    try {
      const dataToExport = type === 'current' ? pagedProjects : (type === 'all' ? filteredProjects : projects);
      
      if (dataToExport.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      // Map data to Excel format
      const excelData = dataToExport.map((project, index) => ({
        'No': index + 1,
        'Regional': project.regional || '',
        'No Project': project.no_project || '',
        'No SPK': project.no_spk || '',
        'POP': project.pop || '',
        'Nama Project': project.nama_project || '',
        'Port': project.port || '',
        'Jumlah ODP': project.jumlah_odp || '',
        'Mitra': project.mitra || '',
        'Progress': project.progress || '',
        'Persentase': project.persentase ? `${project.persentase}%` : '0%',
        'TOC': project.toc || '',
        'Start Pekerjaan': project.start_pekerjaan || '',
        'Target Active': project.target_active || '',
        'Tanggal Active': project.tanggal_active || '',
        'Aging TOC': project.aging_toc || '',
        'BEP': project.bep || '',
        'Port Terisi': project.port_terisi || '',
        'Idle Port': project.idle_port || '',
        'Occupancy': project.occupancy ? `${project.occupancy}%` : '0%',
        'Target BEP': project.target_bep || '',
        'Capex': project.capex || '',
        'Revenue': project.revenue || '',
        'UIC': project.uic || '',
        'Status': project.status || '',
        'Update Progress': project.update_progress || '',
        'Remark': project.remark || '',
        'Issue': project.issue || '',
        'Next Action': project.next_action || '',
        'Circulir Status': project.circulir_status || '',
        'Created At': project.created_at || '',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Projects");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const tabName = activeTab === 'archived' ? 'Archived' : 'Active';
      const exportType = type === 'current' ? 'CurrentView' : 'AllData';
      const filename = `Projects_${tabName}_${exportType}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      
      toast.success(`Berhasil export ${dataToExport.length} projects`);
      setExportDialogOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error("Gagal export data: " + error.message);
    }
  };

  useEffect(() => {
    fetchProjects();

    // Setup real-time subscription
    const isArchived = activeTab === "archived";
    const channel = supabase
      .channel(`projects-${activeTab}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `is_archived=eq.${isArchived}`
        },
        (payload) => {
          console.log('Project change detected:', payload);
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    const isArchived = activeTab === "archived";
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq('is_archived', isArchived)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
    setPage(1); // Reset to page 1 when switching tabs
  }

  // Filter logic
  const filteredProjects = projects;

  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background py-4 px-4 md:px-6 lg:px-8 gap-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Daftar semua project dalam sistem
        </p>
      </div>

      {/* Project Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Project Data</CardTitle>
              <CardDescription>View and manage all projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Badge variant="outline" className="text-xs">
                Total: {projects.length} projects
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Active Projects
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <ArchiveIcon className="h-4 w-4" />
                Archived
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="lg" text="Memuat data projects..." />
                </div>
              ) : error ? (
                <div className="py-8 text-center text-destructive">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <ProjectTable
                      projects={pagedProjects}
                      loading={loading}
                      readOnly={false}
                      onLogs={handleLogs}
                      onArchive={handleArchive}
                    />
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber: number;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (page <= 3) {
                            pageNumber = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={page === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>

                      <span className="text-sm text-muted-foreground ml-2">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-0">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner size="lg" text="Memuat data arsip..." />
                </div>
              ) : error ? (
                <div className="py-8 text-center text-destructive">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <ProjectTable
                      projects={pagedProjects}
                      loading={loading}
                      readOnly={false}
                      onLogs={handleLogs}
                      onRestore={handleRestore}
                    />
                  </div>

                  {/* Pagination for archived */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber: number;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (page <= 3) {
                            pageNumber = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={page === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>

                      <span className="text-sm text-muted-foreground ml-2">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProjectLogsDialog
        open={logsDialogOpen}
        setOpen={setLogsDialogOpen}
        project={selectedProject}
      />
      <ArchiveProjectDialog
        open={archiveDialogOpen}
        setOpen={setArchiveDialogOpen}
        project={selectedProject}
        onSuccess={handleArchiveSuccess}
      />
      {/* Dialogs */}
      <ProjectLogsDialog
        open={logsDialogOpen}
        setOpen={setLogsDialogOpen}
        project={selectedProject}
      />
      <ArchiveProjectDialog
        open={archiveDialogOpen}
        setOpen={setArchiveDialogOpen}
        project={selectedProject}
        onSuccess={handleArchiveSuccess}
      />
      <RestoreProjectDialog
        open={restoreDialogOpen}
        setOpen={setRestoreDialogOpen}
        project={selectedProject}
        onSuccess={handleRestoreSuccess}
      />

      {/* Export Dialog */}
      {exportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export to Excel
              </CardTitle>
              <CardDescription>
                Pilih jenis data yang ingin diexport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('current')}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="font-semibold">Export Current View</div>
                  <div className="text-xs text-muted-foreground">
                    Export {pagedProjects.length} projects yang sedang ditampilkan di halaman ini
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => handleExport('all')}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="font-semibold">Export All Data</div>
                  <div className="text-xs text-muted-foreground">
                    Export semua {filteredProjects.length} projects ({activeTab === 'archived' ? 'Archived' : 'Active'})
                  </div>
                </div>
              </Button>

              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setExportDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

