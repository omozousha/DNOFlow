"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, File } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface AttachmentUploadProps {
  projectId?: string;
  onUploadSuccess?: () => void;
}

const ALLOWED_TYPES = {
  'application/pdf': { ext: '.pdf', icon: FileText, color: 'text-red-500' },
  'application/vnd.ms-excel': { ext: '.xls', icon: FileText, color: 'text-green-500' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', icon: FileText, color: 'text-green-500' },
  'application/msword': { ext: '.doc', icon: FileText, color: 'text-blue-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', icon: FileText, color: 'text-blue-500' },
  'application/vnd.google-earth.kml+xml': { ext: '.kml', icon: File, color: 'text-purple-500' },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUpload({ projectId, onUploadSuccess }: AttachmentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      // Check file type
      if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
        toast.error(`File ${file.name}: Tipe file tidak didukung. Hanya PDF, Excel, Word, dan KML.`);
        continue;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name}: Ukuran file melebihi 10MB.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }
    
    if (!projectId) {
      toast.error("Project ID tidak ditemukan");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      for (const file of files) {
        // Upload to storage
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${projectId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('project_attachments')
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id,
          });

        if (dbError) throw dbError;
      }

      toast.success(`${files.length} file berhasil diupload`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess?.();
    } catch (error: any) {
      toast.error("Gagal upload file: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  function getFileIcon(file: File) {
    const typeInfo = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!typeInfo) return File;
    return typeInfo.icon;
  }

  function getFileColor(file: File) {
    const typeInfo = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    return typeInfo?.color || 'text-gray-500';
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Upload Dokumen (Opsional)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Excel, Word, KML - Maks. 10MB per file
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xls,.xlsx,.doc,.docx,.kml"
          onChange={handleFileSelect}
          className="flex-1"
          disabled={uploading}
        />
        {files.length > 0 && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? 'Uploading...' : `Upload (${files.length})`}
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className={`h-4 w-4 flex-shrink-0 ${getFileColor(file)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
