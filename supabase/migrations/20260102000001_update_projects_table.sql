-- Migration: Update projects table structure and RLS policies
-- Date: 2026-01-02
-- Description: Ensure all fields match form requirements and proper RLS

-- Create or update projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identitas Project (6 fields)
  regional TEXT NOT NULL CHECK (regional IN ('BANTEN', 'JABAR', 'JABODEBEK', 'JATENGKAL', 'JATIM', 'SULAWESI')),
  pop TEXT NOT NULL CHECK (char_length(pop) <= 20),
  no_project TEXT NOT NULL UNIQUE CHECK (char_length(no_project) <= 20),
  no_spk TEXT CHECK (char_length(no_spk) <= 50),
  nama_project TEXT NOT NULL,
  mitra TEXT,
  
  -- Kapasitas (5 fields, 2 auto-calculated)
  port INTEGER NOT NULL DEFAULT 0 CHECK (port >= 0),
  jumlah_odp INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_odp >= 0),
  port_terisi INTEGER DEFAULT 0 CHECK (port_terisi >= 0),
  idle_port INTEGER GENERATED ALWAYS AS (port - COALESCE(port_terisi, 0)) STORED,
  occupancy TEXT, -- Stored as percentage string "XX.XX%"
  
  -- Timeline & Progress (7 fields)
  progress TEXT NOT NULL,
  start_pekerjaan DATE,
  toc INTEGER DEFAULT 0, -- Field Number: hari pekerjaan dilapangan
  aging_toc DATE,
  target_active DATE,
  tanggal_active DATE, -- RFS date
  update_progress TIMESTAMPTZ DEFAULT NOW(),
  
  -- Finansial & Status (6 fields, 3 auto-calculated)
  bep INTEGER DEFAULT 0, -- Field Number: bulan ROI
  target_bep DATE,
  capex TEXT, -- Stored as formatted currency "Rp XXX.XXX"
  revenue TEXT,
  uic TEXT, -- Auto from progress mapping
  status TEXT, -- Auto from progress mapping
  
  -- Catatan (4 fields)
  remark TEXT,
  issue TEXT,
  next_action TEXT,
  circulir_status TEXT DEFAULT 'ongoing' CHECK (circulir_status IN ('ongoing', 'hold', 'reject')),
  
  -- Metadata
  organization_id UUID,
  division TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_regional ON public.projects(regional);
CREATE INDEX IF NOT EXISTS idx_projects_no_project ON public.projects(no_project);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_uic ON public.projects(uic);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON public.projects(progress);
CREATE INDEX IF NOT EXISTS idx_projects_division ON public.projects(division);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- RLS Policy: SELECT - All authenticated users can view projects
CREATE POLICY "projects_select_policy" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (true);

-- RLS Policy: INSERT - Only authenticated users with role admin/owner/controller can insert
CREATE POLICY "projects_insert_policy" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner', 'controller')
    AND profiles.is_active = true
  )
);

-- RLS Policy: UPDATE - Only authenticated users with role admin/owner/controller can update
-- Planning division can only update planning-phase projects
-- Deployment division can only update deployment-phase projects
CREATE POLICY "projects_update_policy" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner', 'controller')
    AND profiles.is_active = true
    AND (
      -- Admin can update all
      profiles.role = 'admin'
      OR
      -- Owner can update all
      profiles.role = 'owner'
      OR
      -- Controller with PLANNING division can update planning phase
      (profiles.role = 'controller' AND profiles.division = 'PLANNING' AND uic IN ('PLANNING', 'PLANNING & DEPLOYMENT'))
      OR
      -- Controller with DEPLOYMENT division can update deployment phase
      (profiles.role = 'controller' AND profiles.division = 'DEPLOYMENT' AND uic IN ('DEPLOYMENT', 'PLANNING & DEPLOYMENT'))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner', 'controller')
    AND profiles.is_active = true
  )
);

-- RLS Policy: DELETE/ARCHIVE - Only admin and owner can delete/archive
CREATE POLICY "projects_delete_policy" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
    AND profiles.is_active = true
  )
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.projects TO authenticated;
GRANT INSERT ON public.projects TO authenticated;
GRANT UPDATE ON public.projects TO authenticated;
GRANT DELETE ON public.projects TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.projects IS 'Projects table with RLS policies for multi-role access control';
COMMENT ON COLUMN public.projects.regional IS 'Regional berdasarkan project (BANTEN, JABAR, etc)';
COMMENT ON COLUMN public.projects.no_project IS 'Nomor project yang sudah dibuat (max 20 chars)';
COMMENT ON COLUMN public.projects.no_spk IS 'Nomor SPK yang sudah dibuat (max 50 chars)';
COMMENT ON COLUMN public.projects.toc IS 'TOC adalah jumlah hari pekerjaan dilapangan (Field Number)';
COMMENT ON COLUMN public.projects.bep IS 'Jumlah berapa bulan biaya investasi akan balik (Field Number)';
COMMENT ON COLUMN public.projects.occupancy IS 'Occupancy calculated as: (port_terisi / port) * 100';
COMMENT ON COLUMN public.projects.capex IS 'CAPEX calculated as: port * 850000 formatted as currency';
COMMENT ON COLUMN public.projects.uic IS 'UIC otomatis terisi mengikuti mapping task';
COMMENT ON COLUMN public.projects.status IS 'Status otomatis terisi mengikuti mapping task';
COMMENT ON COLUMN public.projects.circulir_status IS 'Circulir Status: ongoing/hold/reject, otomatis terisi ongoing tetapi bisa di rubah hold/reject di tengah project';
