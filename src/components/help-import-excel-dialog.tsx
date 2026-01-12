"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function HelpImportExcelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Custom overlay for blur and dark effect */}
      <DialogPrimitive.Overlay
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(10,10,20,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <DialogContent
        className="w-fit max-w-[98vw] p-0"
        style={{
          borderRadius: 0,
          boxShadow: '0 8px 40px 8px rgba(0,0,0,0.45)',
          background: 'var(--background, #18181b)',
          zIndex: 60,
          padding: 0,
        }}
      >
        <DialogHeader className="px-8 pt-8">
          <DialogTitle className="text-2xl font-bold text-primary">Ketentuan Import Data Excel</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-8 pb-8 pt-2">
          <section className="mb-6">
            <h3 className="text-base font-semibold mb-1 text-muted-foreground">1. Format File</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Format file: <span className="font-semibold text-primary">.xlsx</span>, <span className="font-semibold text-primary">.xls</span> (Excel Workbook), atau <span className="font-semibold text-primary">.csv</span></li>
              <li>Hanya sheet pertama yang akan diproses</li>
            </ul>
            <div className="mt-2">
              <a
                href="/template-import.csv"
                download
                className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Template Excel (CSV)
              </a>
            </div>
          </section>
          <section className="mb-6">
            <h3 className="text-base font-semibold mb-1 text-muted-foreground">2. Struktur & Penjelasan Kolom</h3>
            <p className="text-sm mb-2">Baris pertama (header) harus berisi nama kolom berikut, urut dan case-insensitive:</p>
            <div className="overflow-x-auto rounded border border-border bg-background">
              <Table className="min-w-fit text-xs border-collapse">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="py-2 px-3 text-left font-semibold">Kolom</TableHead>
                    <TableHead className="py-2 px-3 text-left font-semibold">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="py-1 px-3">regional</TableCell><TableCell>Regional/area proyek</TableCell></TableRow>
                  <TableRow className="bg-yellow-50"><TableCell className="py-1 px-3 font-bold text-yellow-700">no_project *</TableCell><TableCell className="font-semibold text-yellow-700">Nomor unik project (wajib)</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">no_spk</TableCell><TableCell>Nomor SPK</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">pop</TableCell><TableCell>Nama POP</TableCell></TableRow>
                  <TableRow className="bg-yellow-50"><TableCell className="py-1 px-3 font-bold text-yellow-700">nama_project *</TableCell><TableCell className="font-semibold text-yellow-700">Nama project (wajib)</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">port</TableCell><TableCell>Jumlah port</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">jumlah_odp</TableCell><TableCell>Jumlah ODP</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">mitra</TableCell><TableCell>Nama mitra pelaksana</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">progress</TableCell><TableCell>Status/progress project</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">toc</TableCell><TableCell>Tanggal On Construction</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">start_pekerjaan</TableCell><TableCell>Tanggal mulai pekerjaan</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">target_active</TableCell><TableCell>Target tanggal aktif</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">tanggal_active</TableCell><TableCell>Tanggal aktif (RFS)</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">aging_toc</TableCell><TableCell>Aging TOC</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">bep</TableCell><TableCell>BEP</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">port_terisi</TableCell><TableCell>Port terisi</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">idle_port</TableCell><TableCell>Idle port</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">occupancy</TableCell><TableCell>Persentase occupancy</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">target_bep</TableCell><TableCell>Target BEP</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">capex</TableCell><TableCell>CAPEX</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">revenue</TableCell><TableCell>Revenue</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">uic</TableCell><TableCell>UIC</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">status</TableCell><TableCell>Status project</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">update_progress</TableCell><TableCell>Update progress terakhir</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">remark</TableCell><TableCell>Catatan/remark</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">issue</TableCell><TableCell>Issue/kendala</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">next_action</TableCell><TableCell>Next action/plan</TableCell></TableRow>
                  <TableRow><TableCell className="py-1 px-3">circulir_status</TableCell><TableCell>Status circulir</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="text-xs mt-2 text-yellow-700">* Kolom wajib diisi</div>
          </section>
          <section className="mb-6">
            <h3 className="text-base font-semibold mb-1 text-muted-foreground">3. Data</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Setiap baris mewakili satu project worksheet.</li>
              <li>Data numerik (misal: jumlah_odp, port, capex, revenue) boleh diisi angka atau string.</li>
              <li>Hindari karakter spesial yang tidak umum pada data.</li>
            </ul>
          </section>
          <section className="mb-6">
            <h3 className="text-base font-semibold mb-1 text-muted-foreground">4. Contoh Header Excel</h3>
            <div className="overflow-x-auto bg-muted rounded p-2 border text-xs font-mono select-all">
              regional, no_project, no_spk, pop, nama_project, port, jumlah_odp, mitra, progress, toc, start_pekerjaan, target_active, tanggal_active, aging_toc, bep, port_terisi, idle_port, occupancy, target_bep, capex, revenue, uic, status, update_progress, remark, issue, next_action, circulir_status
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold mb-1 text-muted-foreground">5. Cara Import</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Klik tombol <b>Import Excel</b> pada halaman worksheet.</li>
              <li>Pilih file Excel yang sudah sesuai ketentuan di atas.</li>
              <li>Data akan divalidasi dan ditampilkan di tabel jika berhasil.</li>
              <li>Jika ada error, cek kembali format dan isi file Anda.</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded text-xs">
              <b>Tips:</b> Untuk template, gunakan fitur export Excel pada worksheet untuk mendapatkan struktur file yang valid.
            </div>
          </section>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
