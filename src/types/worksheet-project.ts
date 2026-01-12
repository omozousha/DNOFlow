// Worksheet/project data type for worksheet table and CRUD
export interface WorksheetProject {
  id?: string;
  regional?: string;
  no_project?: string;
  no_spk?: string;
  pop?: string;
  nama_project?: string;
  port?: string;
  jumlah_odp?: string;
  mitra?: string;
  progress?: string;
  persentase?: string;
  toc?: string;
  start_pekerjaan?: string;
  target_active?: string;
  tanggal_active?: string;
  aging_toc?: string;
  bep?: string;
  port_terisi?: string;
  idle_port?: string;
  occupancy?: string;
  target_bep?: string;
  capex?: string;
  revenue?: string;
  uic?: string;
  status?: string;
  update_progress?: string;
  remark?: string;
  issue?: string;
  next_action?: string;
  circulir_status?: string;
  created_at?: string;
  [key: string]: string | undefined;
}
