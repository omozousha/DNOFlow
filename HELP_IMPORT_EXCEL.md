
# Panduan Import Data Worksheet (Excel)

>Agar proses import data worksheet berjalan lancar, pastikan file Excel Anda memenuhi ketentuan berikut:

## 1. Format File
- Format file: **.xlsx** atau **.xls** (Excel Workbook)
- Hanya sheet pertama yang akan diproses

## 2. Struktur & Penjelasan Kolom
Baris pertama (header) harus berisi nama kolom berikut, urut dan case-insensitive:

| Kolom            | Keterangan                        |
|------------------|-----------------------------------|
| regional         | Regional/area proyek              |
| no_project       | Nomor unik project (**wajib**)    |
| no_spk           | Nomor SPK                         |
| pop              | Nama POP                          |
| nama_project     | Nama project (**wajib**)          |
| port             | Jumlah port                       |
| jumlah_odp       | Jumlah ODP                        |
| mitra            | Nama mitra pelaksana              |
| progress         | Status/progress project           |
| toc              | Tanggal On Construction           |
| start_pekerjaan  | Tanggal mulai pekerjaan           |
| target_active    | Target tanggal aktif              |
| tanggal_active   | Tanggal aktif (RFS)               |
| aging_toc        | Aging TOC                         |
| bep              | BEP                               |
| port_terisi      | Port terisi                       |
| idle_port        | Idle port                         |
| occupancy        | Persentase occupancy              |
| target_bep       | Target BEP                        |
| capex            | CAPEX                             |
| revenue          | Revenue                           |
| uic              | UIC                               |
| status           | Status project                    |
| update_progress  | Update progress terakhir          |
| remark           | Catatan/remark                    |
| issue            | Issue/kendala                     |
| next_action      | Next action/plan                  |
| circulir_status  | Status circulir                   |

- Kolom boleh dikosongkan jika tidak ada data, namun **no_project** dan **nama_project** wajib diisi.

## 3. Data
- Setiap baris mewakili satu project worksheet.
- Data numerik (misal: jumlah_odp, port, capex, revenue) boleh diisi angka atau string.
- Hindari karakter spesial yang tidak umum pada data.

## 4. Contoh Header Excel

| regional | no_project | no_spk | pop | nama_project | port | jumlah_odp | mitra | progress | toc | start_pekerjaan | target_active | tanggal_active | aging_toc | bep | port_terisi | idle_port | occupancy | target_bep | capex | revenue | uic | status | update_progress | remark | issue | next_action | circulir_status |
|----------|------------|--------|-----|--------------|------|------------|-------|----------|-----|-----------------|---------------|----------------|-----------|-----|-------------|-----------|-----------|------------|-------|---------|-----|--------|------------------|--------|-------|-------------|-----------------|

## 5. Cara Import
1. Klik tombol **Import Excel** pada halaman worksheet.
2. Pilih file Excel yang sudah sesuai ketentuan di atas.
3. Data akan divalidasi dan ditampilkan di tabel jika berhasil.
4. Jika ada error, cek kembali format dan isi file Anda.

---
**Tips:**
- Download **template-import.csv** dari halaman Help untuk mendapatkan contoh struktur file yang valid.

**Catatan:**
- Data yang tidak sesuai format akan diabaikan.
- Template CSV sudah menyediakan struktur kolom yang sesuai dengan database.
