# Ketentuan Import Data Worksheet (Excel)

Agar proses import data worksheet berjalan lancar, pastikan file Excel Anda memenuhi ketentuan berikut:

## 1. Format File
- File harus berformat `.xlsx` atau `.xls` (Excel Workbook).
- Hanya sheet pertama yang akan diproses.

## 2. Struktur Kolom
- Nama kolom pada baris pertama harus persis sesuai urutan berikut (case-insensitive):

  1. regional
  2. no_project
  3. no_spk
  4. pop
  5. nama_project
  6. port
  7. jumlah_odp
  8. mitra
  9. progress
  10. toc
  11. start_pekerjaan
  12. target_active
  13. tanggal_active
  14. aging_toc
  15. bep
  16. port_terisi
  17. target_bep
  18. revenue
  19. remark
  20. issue
  21. next_action
  22. circulir_status

**Catatan:** Kolom `idle_port`, `occupancy`, `capex`, `uic`, `status`, dan `update_progress` akan dihitung otomatis oleh sistem.

- Kolom boleh dikosongkan jika tidak ada data, namun **regional**, **no_project**, **nama_project**, dan **progress** wajib diisi.

## 3. Data
- Setiap baris mewakili satu project worksheet.
- Data numerik (misal: jumlah_odp, port, capex, revenue) boleh diisi angka atau string.
- Hindari karakter spesial yang tidak umum pada data.

## 4. Contoh Header Excel

| regional | no_project | no_spk | pop | nama_project | port | jumlah_odp | mitra | progress | toc | start_pekerjaan | target_active | tanggal_active | aging_toc | bep | port_terisi | target_bep | revenue | remark | issue | next_action | circulir_status |
|----------|------------|--------|-----|--------------|------|------------|-------|----------|-----|-----------------|---------------|----------------|-----------|-----|-------------|------------|---------|--------|-------|-------------|-----------------|

**Kolom yang dihitung otomatis (tidak perlu diisi):**
- `idle_port` = port - port_terisi
- `occupancy` = (port_terisi / port) × 100%
- `capex` = revenue × 0.6
- `uic` = berdasarkan progress (PLANNING/DEPLOYMENT)
- `status` = berdasarkan progress (DESAIN/CONSTRUCTION/RFS/etc)
- `update_progress` = timestamp saat ini

## 5. Proses Import
- Klik tombol **Import Excel** pada halaman worksheet.
- Pilih file Excel yang sudah sesuai ketentuan di atas.
- Data akan divalidasi dan ditampilkan di tabel jika berhasil.
- Jika ada error, cek kembali format dan isi file Anda.

---

**Catatan:**
- Data yang tidak sesuai format akan diabaikan.
- Download **template-import.csv** dari halaman Help untuk mendapatkan contoh struktur file yang valid.
