-- Migration: Create project_attachments table and storage bucket
-- Description: Add attachment functionality for project documents (PDF, Excel, Word, KML)

-- Create project_attachments table
CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  CONSTRAINT file_size_positive CHECK (file_size > 0),
  CONSTRAINT file_size_limit CHECK (file_size <= 10485760) -- 10MB limit
);

-- Create indexes for better query performance
CREATE INDEX idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX idx_project_attachments_uploaded_at ON project_attachments(uploaded_at DESC);
CREATE INDEX idx_project_attachments_uploaded_by ON project_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_attachments table
-- Policy 1: Users can view attachments of projects in their division
CREATE POLICY "Users can view attachments in their division"
ON project_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = project_attachments.project_id
    AND (
      pr.role = 'admin' 
      OR pr.division = p.division 
      OR pr.division IS NULL
    )
  )
);

-- Policy 2: Users can insert attachments for projects in their division
CREATE POLICY "Users can upload attachments to their division projects"
ON project_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN profiles pr ON pr.id = auth.uid()
    WHERE p.id = project_attachments.project_id
    AND (
      pr.role = 'admin' 
      OR pr.division = p.division 
      OR pr.division IS NULL
    )
  )
);

-- Policy 3: Users can delete attachments they uploaded or admin can delete any
CREATE POLICY "Users can delete their own attachments or admin can delete any"
ON project_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.id = auth.uid()
    AND (
      pr.role = 'admin' 
      OR project_attachments.uploaded_by = auth.uid()
    )
  )
);

-- Storage bucket will be created via Supabase Dashboard or CLI:
-- Bucket name: project-attachments
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, application/vnd.ms-excel, 
--   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   application/vnd.google-earth.kml+xml

-- Storage RLS Policies (run these after creating the bucket):
-- Policy 1: Users can view files in their division projects
-- CREATE POLICY "Users can view files in their division"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'project-attachments' AND (
--   auth.uid() IN (
--     SELECT pr.id FROM profiles pr
--     INNER JOIN projects p ON (pr.division = p.division OR pr.role = 'admin')
--     WHERE p.id::text = (storage.foldername(name))[1]
--   )
-- ));

-- Policy 2: Users can upload files to their division projects
-- CREATE POLICY "Users can upload files to their division"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'project-attachments' AND (
--   auth.uid() IN (
--     SELECT pr.id FROM profiles pr
--     INNER JOIN projects p ON (pr.division = p.division OR pr.role = 'admin')
--     WHERE p.id::text = (storage.foldername(name))[1]
--   )
-- ));

-- Policy 3: Users can delete files they uploaded or admin can delete any
-- CREATE POLICY "Users can delete their own files or admin"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'project-attachments' AND (
--   auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
--   OR auth.uid() = owner
-- ));

COMMENT ON TABLE project_attachments IS 'Stores metadata for project document attachments';
COMMENT ON COLUMN project_attachments.file_path IS 'Storage path: {project_id}/{timestamp}_{filename}';
COMMENT ON COLUMN project_attachments.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN project_attachments.file_size IS 'File size in bytes (max 10MB)';
