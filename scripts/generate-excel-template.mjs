// Script to generate Excel template for project import
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define template columns
const columns = [
  'regional',
  'no_project',
  'no_spk',
  'pop',
  'nama_project',
  'port',
  'jumlah_odp',
  'mitra',
  'progress',
  'toc',
  'start_pekerjaan',
  'target_active',
  'tanggal_active',
  'aging_toc',
  'bep',
  'port_terisi',
  'target_bep',
  'revenue',
  'update_progress',
  'remark',
  'issue',
  'next_action',
  'circulir_status'
];

// Sample data rows
const sampleData = [
  {
    regional: 'JABAR',
    no_project: 'PRJ001',
    no_spk: 'SPK123',
    pop: 'POP BANDUNG',
    nama_project: 'Project FTTH Bandung Timur',
    port: 100,
    jumlah_odp: 50,
    mitra: 'PT Mitra A',
    progress: 'CREATED BOQ',
    toc: 30,
    start_pekerjaan: '2026-01-15',
    target_active: '2026-03-01',
    tanggal_active: '',
    aging_toc: '',
    bep: 12,
    port_terisi: 25,
    target_bep: '2026-05-01',
    revenue: 500000000,
    update_progress: '2026-01-10',
    remark: 'Project baru dalam tahap desain',
    issue: 'Belum ada issue',
    next_action: 'Survey lokasi',
    circulir_status: 'ongoing'
  },
  {
    regional: 'JATIM',
    no_project: 'PRJ002',
    no_spk: 'SPK124',
    pop: 'POP SURABAYA',
    nama_project: 'Project Expansion Surabaya Barat',
    port: 200,
    jumlah_odp: 80,
    mitra: 'PT Mitra B',
    progress: 'CONST',
    toc: 45,
    start_pekerjaan: '2025-12-01',
    target_active: '2026-02-15',
    tanggal_active: '2026-02-20',
    aging_toc: '2026-02-10',
    bep: 18,
    port_terisi: 150,
    target_bep: '2026-06-01',
    revenue: 800000000,
    update_progress: '2026-01-05',
    remark: 'Dalam tahap konstruksi',
    issue: 'Perizinan tertunda 3 hari',
    next_action: 'Follow up perizinan',
    circulir_status: 'ongoing'
  }
];

// Create worksheet with headers and sample data
const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: columns });

// Set column widths
const columnWidths = columns.map(col => {
  if (col === 'nama_project') return { wch: 35 };
  if (col === 'remark' || col === 'issue' || col === 'next_action') return { wch: 30 };
  if (col === 'no_project' || col === 'no_spk') return { wch: 15 };
  if (col === 'regional' || col === 'mitra') return { wch: 20 };
  if (col === 'progress') return { wch: 18 };
  if (col === 'revenue') return { wch: 15 };
  return { wch: 12 };
});

worksheet['!cols'] = columnWidths;

// Add instructions sheet
const instructions = [
  ['PANDUAN IMPORT DATA PROJECT'],
  [''],
  ['KOLOM WAJIB (Harus diisi):'],
  ['1. regional - Regional project (JABAR, JATIM, etc)'],
  ['2. no_project - Nomor project unik'],
  ['3. nama_project - Nama project'],
  ['4. pop - Point of Presence'],
  [''],
  ['KOLOM OPSIONAL (Boleh kosong - bisa diisi saat update):'],
  ['- no_spk, port, jumlah_odp, mitra, progress, toc'],
  ['- start_pekerjaan, target_active, tanggal_active'],
  ['- aging_toc, bep, port_terisi, target_bep'],
  ['- revenue, update_progress, remark, issue'],
  ['- next_action, circulir_status'],
  [''],
  ['FORMAT TANGGAL:'],
  ['Gunakan format: YYYY-MM-DD (contoh: 2026-01-15)'],
  [''],
  ['FORMAT ANGKA:'],
  ['- port, jumlah_odp, toc, bep, port_terisi: Angka bulat'],
  ['- revenue: Angka tanpa pemisah (contoh: 500000000)'],
  [''],
  ['KOLOM AUTO-CALCULATE (Jangan diisi):'],
  ['- occupancy: Dihitung otomatis dari port_terisi/port'],
  ['- idle_port: Dihitung otomatis dari port-port_terisi'],
  ['- target_revenue: Dihitung otomatis'],
  ['- gap_revenue: Dihitung otomatis'],
  ['- aging_bep: Dihitung otomatis'],
  ['- persentase: Dihitung otomatis'],
  [''],
  ['PROGRESS OPTIONS (Isi tanpa nomor):'],
  ['REJECT, PENDING / HOLD, CREATED BOQ, CHECKED BOQ,'],
  ['BEP, APPROVED, SPK SURVEY, SURVEY, DRM,'],
  ['APPROVED BOQ DRM, SPK, MOS, PERIZINAN, CONST,'],
  ['COMMTEST, UT, REKON, BAST, BALOP, DONE'],
  [''],
  ['PROGRESS ALIASES (Otomatis dikonversi):'],
  ['• HOLD atau PENDING → PENDING / HOLD'],
  ['• CANCEL, CANCELLED, CANCELED → REJECT'],
  ['• RFS atau READY FOR SERVICE → REKON'],
  ['• CONSTRUCTION → CONST'],
  ['• COMPLETE, COMPLETED, FINISH, FINISHED, DEPLOYMENT → DONE'],
  [''],
  ['Contoh pengisian progress:'],
  ['✓ Benar: "BAST" atau "bast" (sistem akan normalisasi)'],
  ['✓ Benar: "CONST" atau "const"'],
  ['✗ Salah: "18. BAST" (jangan pakai nomor)'],
  [''],
  ['REGIONAL OPTIONS:'],
  ['BANTEN, JABAR, JABODEBEK, JATENGKAL, JATIM, SULAWESI'],
  ['Contoh: "JABAR" atau "1. JABAR" (sistem auto-normalisasi)'],
  [''],
  ['CIRCULIR STATUS OPTIONS:'],
  ['ongoing, hold, reject'],
  ['Contoh: "ongoing" atau "1. ongoing" (sistem auto-normalisasi)'],
  [''],
  ['💡 AUTO-NORMALISASI:'],
  ['Sistem otomatis menghapus nomor di awal semua field pilihan'],
  ['(regional, progress, circulir_status). Jadi Anda bisa menulis:'],
  ['"1. JABAR" → "JABAR", "18. BAST" → "BAST", "1. ongoing" → "ongoing"'],
  [''],
  ['CATATAN PENTING:'],
  ['1. Hapus baris contoh (PRJ001, PRJ002) sebelum import'],
  ['2. Pastikan no_project unique (tidak boleh duplikat)'],
  ['3. Sheet "Data" yang akan otomatis di-import'],
  ['4. TIDAK PERLU hapus sheet "Panduan" - sistem akan otomatis baca sheet "Data"'],
  ['5. Maksimal 1000 rows per import'],
  [''],
  ['CARA IMPORT:'],
  ['1. Isi data Anda di sheet "Data" (hapus baris sample)'],
  ['2. Save file (tetap format .xlsx)'],
  ['3. Upload langsung - sheet "Panduan" akan diabaikan otomatis'],
];

const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);

// Set instruction column width
instructionSheet['!cols'] = [{ wch: 60 }];

// Create workbook and add sheets
const workbook = XLSX.utils.book_new();
// Add Data sheet FIRST so it's the default, but system will auto-detect "Data" sheet anyway
XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Panduan');

// Write to file
const outputPath = path.join(__dirname, '..', 'public', 'template-import-project.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Template Data (default), Panduan');
console.log('📊 Sample data: 2 rows');
console.log('💡 Sheet "Data" akan otomatis dibaca saat import - tidak perlu hapus "Panduan"ta');
console.log('📊 Sample data: 2 rows');
