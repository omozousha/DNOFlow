"use client";
/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Info,
  List,
  Settings
} from "lucide-react";
import { toast } from "sonner";

export default function HelpPage() {
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template-import.csv';
    link.download = 'template-import-project.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template CSV berhasil didownload");
  };

  const handleDownloadExcelTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template-import-project.xlsx';
    link.download = 'template-import-project.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template Excel berhasil didownload");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background py-4 px-4 md:px-6 lg:px-8 gap-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Panduan Penggunaan</h1>
        </div>
        <p className="text-muted-foreground">
          Panduan lengkap untuk mengelola project worksheet
        </p>
      </div>

      {/* Quick Download Template */}
      <Alert className="bg-primary/5 border-primary/20">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm">Butuh template untuk import data?</span>
          <div className="flex gap-2">
            <Button onClick={handleDownloadExcelTemplate} size="sm" variant="default">
              <Download className="h-4 w-4 mr-2" />
              Download Template Excel (.xlsx)
            </Button>
            <Button onClick={handleDownloadTemplate} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Cara Input Manual */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <CardTitle>Input Project Manual</CardTitle>
            </div>
            <CardDescription>Cara menambahkan project satu per satu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p className="text-sm">Klik tombol <strong>"Add New Project"</strong> di halaman worksheet</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p className="text-sm">Isi form yang muncul di drawer sebelah kanan</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p className="text-sm">Field dengan tanda <span className="text-red-500">*</span> wajib diisi</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <p className="text-sm">Field dengan badge <Badge variant="secondary" className="text-xs">Auto</Badge> akan dihitung otomatis</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">5</Badge>
                <p className="text-sm">Klik <strong>"Save Project"</strong> untuk menyimpan</p>
              </div>
            </div>
            <Separator />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Form akan otomatis calculate: <strong>Idle Port, Occupancy, Capex, Status, UIC</strong> berdasarkan input Anda
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 2. Cara Import Excel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Import dari Excel</CardTitle>
            </div>
            <CardDescription>Cara import data project secara batch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p className="text-sm">Download template Excel (.xlsx) atau CSV dengan tombol di atas</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p className="text-sm">
                  <strong>Excel (.xlsx)</strong>: Buka dengan Microsoft Excel/LibreOffice
                  <br/>
                  <strong>CSV</strong>: Buka dengan Excel/Google Sheets
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p className="text-sm">
                  Untuk template Excel: Baca sheet <strong>"Panduan"</strong> terlebih dahulu
                  <br/>
                  Isi data di sheet <strong>"Data"</strong>
                  <br/>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Tidak perlu hapus sheet "Panduan" - sistem otomatis baca sheet "Data"
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <p className="text-sm">Hapus 2 baris contoh (PRJ001, PRJ002) sebelum isi data Anda</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">5</Badge>
                <p className="text-sm">Isi data project sesuai format template</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">6</Badge>
                <p className="text-sm">Save file (tetap sebagai .xlsx atau .csv)</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">7</Badge>
                <p className="text-sm">Klik <strong>"Import Excel"</strong> di halaman worksheet</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">8</Badge>
                <p className="text-sm">Upload file dan tunggu validasi selesai</p>
              </div>
            </div>
            <Separator />
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs">
                <strong>✓ Sheet "Panduan" diabaikan otomatis</strong> - Sistem hanya membaca sheet "Data". Anda dapat menyimpan kedua sheet tanpa perlu menghapus "Panduan"
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                <strong>💡 Auto-Normalisasi Field</strong> - Sistem otomatis menghapus nomor di awal field pilihan (regional, progress, circulir_status). Contoh: "1. JABAR" → "JABAR", "18. BAST" → "BAST"
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs">
                Sistem akan <strong>validasi otomatis</strong> dan menolak data yang tidak sesuai format
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* 3. Penjelasan Field */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            <CardTitle>Penjelasan Field Wajib</CardTitle>
          </div>
          <CardDescription>Field-field penting yang harus diisi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3 text-destructive">Field Wajib Diisi (Saat Create Project):</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Regional <Badge variant="destructive" className="text-xs">Wajib</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Pilih dari: BANTEN, JABAR, JABODEBEK, JATENGKAL, JATIM, SULAWESI</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    No Project <Badge variant="destructive" className="text-xs">Wajib</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Nomor unik project (max 20 karakter)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Nama Project <Badge variant="destructive" className="text-xs">Wajib</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Nama lengkap project</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    POP <Badge variant="destructive" className="text-xs">Wajib</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Point of Presence - Lokasi perangkat utama</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-3 text-blue-600">Field Opsional (Dapat Diisi Saat Update):</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Port <Badge variant="secondary" className="text-xs">Opsional</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Jumlah port (angka)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Jumlah ODP <Badge variant="secondary" className="text-xs">Opsional</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Jumlah Optical Distribution Point (angka)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Progress <Badge variant="secondary" className="text-xs">Opsional</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Status progress project (lihat mapping di bawah)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    No SPK <Badge variant="secondary" className="text-xs">Opsional</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Nomor Surat Perintah Kerja</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Mitra <Badge variant="secondary" className="text-xs">Opsional</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">Nama mitra kerja project</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-3 text-amber-600">Field Perhitungan & Status (Auto/Manual):</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  TOC <Badge variant="secondary" className="text-xs">Days</Badge>
                </h4>
                <p className="text-xs text-muted-foreground">Time of Construction - Jumlah hari pekerjaan di lapangan (angka)</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  BEP <Badge variant="secondary" className="text-xs">Months</Badge>
                </h4>
                <p className="text-xs text-muted-foreground">Break Even Point - Jumlah bulan biaya investasi akan balik (angka)</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Circulir Status
                </h4>
                <p className="text-xs text-muted-foreground">Status circulir: <strong>ongoing</strong> (default), <strong>hold</strong>, atau <strong>reject</strong></p>
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Idle Port <Badge variant="outline" className="text-xs">Auto</Badge>
                </h4>
                <p className="text-xs text-muted-foreground">Otomatis: Port - Port Terisi</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Occupancy <Badge variant="outline" className="text-xs">Auto</Badge>
                </h4>
                <p className="text-xs text-muted-foreground">Otomatis: (Port Terisi / Port) × 100%</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Capex <Badge variant="outline" className="text-xs">Auto</Badge>
                </h4>
                <p className="text-xs text-muted-foreground">Otomatis: Revenue × 60%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Progress Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Progress Mapping</CardTitle>
          </div>
          <CardDescription>Mapping otomatis dari Progress ke Status & UIC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Format Progress</p>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p>• Gunakan format <strong>tanpa nomor</strong> (contoh: "BAST", "CONST", "DONE")</p>
              <p>• Sistem akan otomatis normalisasi jika Anda menulis dengan nomor (contoh: "18. BAST" → "BAST")</p>
              <p>• Huruf besar/kecil tidak masalah (contoh: "bast" atau "BAST" sama-sama valid)</p>
              <p>• Progress bersifat <Badge variant="secondary" className="text-xs">Opsional</Badge> - boleh dikosongkan saat create, diisi saat update</p>
              <p className="pt-2 font-semibold">💡 Alias yang didukung (auto-convert):</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>"HOLD" atau "PENDING" → "PENDING / HOLD"</li>
                <li>"CANCEL" atau "CANCELLED" → "REJECT"</li>
                <li>"RFS" atau "READY FOR SERVICE" → "REKON"</li>
                <li>"CONSTRUCTION" → "CONST"</li>
                <li>"COMPLETE" atau "FINISHED" → "DONE"</li>
              </ul>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary/20 px-4 py-2 text-left font-semibold">PROGRESS task</th>
                  <th className="border border-primary/20 px-4 py-2 text-left font-semibold">STATUS</th>
                  <th className="border border-primary/20 px-4 py-2 text-left font-semibold">UIC/divisi</th>
                  <th className="border border-primary/20 px-4 py-2 text-left font-semibold">PIC</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="bg-muted/30">
                  <td className="border border-border px-4 py-2 font-medium">REJECT</td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="destructive" className="text-xs">CANCEL</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING & DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2 font-medium">PENDING / HOLD</td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="outline" className="text-xs">PENDING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING & DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">CREATED BOQ</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">CHECKED BOQ</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">BEP</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">APPROVED</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">SPK SURVEY</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">SURVEY</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">DRM</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">APPROVED BOQ DRM</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20">
                  <td className="border border-border px-4 py-2 font-medium">SPK</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-blue-500">DESAIN</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">PLANNING</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="border border-border px-4 py-2 font-medium">MOS</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-orange-500">CONSTRUCTION</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="border border-border px-4 py-2 font-medium">PERIZINAN</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-orange-500">CONSTRUCTION</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="border border-border px-4 py-2 font-medium">CONST</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-orange-500">CONSTRUCTION</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="border border-border px-4 py-2 font-medium">COMMTEST</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-orange-500">CONSTRUCTION</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-950/20">
                  <td className="border border-border px-4 py-2 font-medium">UT</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-orange-500">CONSTRUCTION</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-purple-50 dark:bg-purple-950/20">
                  <td className="border border-border px-4 py-2 font-medium">REKON</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-purple-500">RFS</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-purple-50 dark:bg-purple-950/20">
                  <td className="border border-border px-4 py-2 font-medium">BAST</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-purple-500">RFS</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-purple-50 dark:bg-purple-950/20">
                  <td className="border border-border px-4 py-2 font-medium">BALOP</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-purple-500">RFS</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
                <tr className="bg-green-50 dark:bg-green-950/20">
                  <td className="border border-border px-4 py-2 font-medium">DONE</td>
                  <td className="border border-border px-4 py-2">
                    <Badge className="text-xs bg-green-600">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2">
                    <Badge variant="secondary" className="text-xs">DEPLOYMENT</Badge>
                  </td>
                  <td className="border border-border px-4 py-2 text-muted-foreground italic">pic yang harus di tentukan untuk kebutuhan matrix raci</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Separator className="my-4" />
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Ketika Anda pilih <strong>Progress</strong>, sistem akan <strong>otomatis set Status dan UIC</strong> sesuai mapping di atas. Kolom PIC untuk kebutuhan matrix RACI akan ditentukan kemudian.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 5. Validasi Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <CardTitle>Validasi Import Excel</CardTitle>
          </div>
          <CardDescription>Aturan validasi yang akan dicek saat import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                <strong>💡 Auto-Normalisasi:</strong> Sistem otomatis menghapus nomor di awal untuk field: <strong>regional</strong>, <strong>progress</strong>, dan <strong>circulir_status</strong>. Contoh: "1. JABAR" → "JABAR", "18. BAST" → "BAST", "1. ongoing" → "ongoing"
              </AlertDescription>
            </Alert>
            <div className="grid gap-3 md:grid-cols-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Regional tidak valid:</strong> Harus dari list BANTEN, JABAR, JABODEBEK, JATENGKAL, JATIM, SULAWESI (sistem auto-normalisasi)
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Progress tidak valid:</strong> Harus dari list REJECT, PENDING / HOLD, CREATED BOQ, CHECKED BOQ, BEP, APPROVED, SPK SURVEY, SURVEY, DRM, APPROVED BOQ DRM, SPK, MOS, PERIZINAN, CONST, COMMTEST, UT, REKON, BAST, BALOP, DONE (sistem auto-normalisasi)
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tipe data salah:</strong> Port, Jumlah ODP, TOC, BEP harus angka
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Division mismatch:</strong> User PLANNING tidak boleh import progress DEPLOYMENT, dst
                </AlertDescription>
              </Alert>
            </div>
            <Separator />
            <div className="bg-muted/30 p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2">Contoh Error Message:</h5>
              <code className="text-xs block bg-background p-2 rounded border space-y-1">
                <div>Baris 3: Regional wajib diisi</div>
                <div>Baris 5: Regional harus salah satu dari BANTEN, JABAR, JABODEBEK, JATENGKAL, JATIM, SULAWESI</div>
                <div>Baris 7: Port harus berupa angka</div>
                <div>Baris 10: Progress tidak valid. Gunakan salah satu: REJECT, PENDING / HOLD, CREATED BOQ, ...</div>
                <div>Baris 12: User PLANNING tidak boleh import project dengan progress DEPLOYMENT</div>
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Jika Anda menulis "1. JABAR" atau "18. BAST", sistem akan otomatis normalisasi menjadi "JABAR" dan "BAST" sebelum validasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Template Excel Features */}
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700 dark:text-green-400">
              Keunggulan Template Excel (.xlsx)
            </CardTitle>
          </div>
          <CardDescription>Template Excel dirancang khusus untuk kemudahan import data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-sm">Sheet Panduan Lengkap</h5>
                  <p className="text-xs text-muted-foreground">
                    Panduan step-by-step, penjelasan kolom, format data, dan contoh pengisian
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-sm">Sample Data Siap Pakai</h5>
                  <p className="text-xs text-muted-foreground">
                    2 baris contoh project untuk memudahkan memahami format yang benar
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-sm">Format Kolom Optimal</h5>
                  <p className="text-xs text-muted-foreground">
                    Lebar kolom sudah disesuaikan untuk kemudahan input dan review data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-sm">List Progress Options</h5>
                  <p className="text-xs text-muted-foreground">
                    Daftar lengkap pilihan progress yang valid untuk memudahkan pengisian
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-sm">Smart Sheet Detection</h5>
                  <p className="text-xs text-muted-foreground">
                    Sistem otomatis membaca sheet "Data" - tidak perlu hapus sheet "Panduan"
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="bg-background/60 p-4 rounded-lg space-y-2">
              <h5 className="font-semibold text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Struktur Template Excel
              </h5>
              <div className="grid gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">Sheet 1: Data</Badge>
                  <span className="text-muted-foreground">
                    Sheet utama untuk input data project (akan otomatis dibaca saat import)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">Sheet 2: Panduan</Badge>
                  <span className="text-muted-foreground">
                    Instruksi lengkap (boleh disimpan atau dihapus - sistem otomatis skip sheet ini)
                  </span>
                </div>
              </div>
            </div>
            <Alert className="border-blue-500/50 bg-blue-100/50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                <strong>🎯 Cara Kerja:</strong> Saat import, sistem otomatis mencari dan membaca sheet bernama "Data". Sheet lain seperti "Panduan" akan diabaikan. Jadi Anda bisa simpan kedua sheet tanpa perlu menghapus apapun!
              </AlertDescription>
            </Alert>
            <Alert className="border-green-500/50 bg-green-100/50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800 dark:text-green-300">
                <strong>💡 Tips:</strong> Gunakan template Excel untuk import data pertama kali atau ketika ingin import banyak data sekaligus. Template akan memandu Anda dengan panduan lengkap dan sample data.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center pt-2">
              <Button onClick={handleDownloadExcelTemplate} size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Download Template Excel (.xlsx)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Butuh bantuan lebih lanjut?</p>
              <p className="text-xs text-muted-foreground">
                Hubungi admin atau tim support untuk assistance lebih lanjut dalam penggunaan sistem ini.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
