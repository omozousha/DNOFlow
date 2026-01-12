# Backend & RLS Documentation
## Projects Table - Database Schema & Security

### 📋 Table Structure

#### Table: `public.projects`

**Identitas Project (6 fields)**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `regional` | TEXT | NOT NULL, CHECK IN (list) | Regional berdasarkan project (BANTEN, JABAR, JABODEBEK, JATENGKAL, JATIM, SULAWESI) |
| `pop` | TEXT | NOT NULL, max 20 chars | Nama POP |
| `no_project` | TEXT | NOT NULL, UNIQUE, max 20 chars | Nomor project yang sudah dibuat di cirkulir luar aplikasi |
| `no_spk` | TEXT | max 50 chars | Nomor SPK yang sudah dibuat di cirkulir luar aplikasi |
| `nama_project` | TEXT | NOT NULL | Nama project sesuai cirkulir di luar aplikasi |
| `mitra` | TEXT | - | Nama mitra/vendor yang mengerjakan project |

**Kapasitas (5 fields, 2 auto-calculated)**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `port` | INTEGER | NOT NULL, >= 0 | Jumlah port |
| `jumlah_odp` | INTEGER | NOT NULL, >= 0 | Jumlah ODP |
| `port_terisi` | INTEGER | >= 0 | Jumlah port yang terisi |
| `idle_port` | INTEGER | GENERATED (auto) | Port - Port Terisi (auto-calculated) |
| `occupancy` | TEXT | - | Port terisi ÷ Port × 100% (format: "XX.XX%") |

**Timeline & Progress (7 fields)**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `progress` | TEXT | NOT NULL | Task progress yang di rubah berdasarkan UIC masing-masing |
| `start_pekerjaan` | DATE | - | Tanggal start pekerjaan |
| `toc` | INTEGER | DEFAULT 0 | TOC adalah jumlah hari pekerjaan dilapangan (FIELD NUMBER) |
| `aging_toc` | DATE | - | Tanggal aging toc, otomatis terisi jika melebihi TOC |
| `target_active` | DATE | - | Otomatis target active berupa tanggal hasil dari perhitungan start pekerjaan dengan toc |
| `tanggal_active` | DATE | - | Tanggal active rfs, di isi saat update |
| `update_progress` | TIMESTAMPTZ | DEFAULT NOW() | Tanggal update progress, otomatis terisi saat buat dan update progress |

**Finansial & Status (6 fields, 3 auto-calculated)**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `bep` | INTEGER | DEFAULT 0 | Jumlah berapa bulan biaya investasi akan balik (FIELD NUMBER) |
| `target_bep` | DATE | - | Tanggal target bep, di isi saat update |
| `capex` | TEXT | - | CAPEX = Port × 850000, format currency RP |
| `revenue` | TEXT | - | Di isi manual, berupa kurensi RP |
| `uic` | TEXT | - | UIC otomatis terisi mengikuti mapping task |
| `status` | TEXT | - | Status otomatis terisi mengikuti mapping task |

**Catatan (4 fields)**
| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `remark` | TEXT | - | Optional |
| `issue` | TEXT | - | Optional |
| `next_action` | TEXT | - | Optional |
| `circulir_status` | TEXT | DEFAULT 'ongoing' | Reject/hold/ongoing - otomatis terisi ongoing tetapi bisa di rubah hold/reject di tengah project |

**Metadata**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key (auto-generated) |
| `organization_id` | UUID | Link to organization |
| `division` | TEXT | User division (PLANNING/DEPLOYMENT) |
| `created_at` | TIMESTAMPTZ | Auto timestamp |
| `updated_at` | TIMESTAMPTZ | Auto timestamp (trigger) |
| `created_by` | UUID | Reference to auth.users |
| `updated_by` | UUID | Reference to auth.users |

---

### 🔒 RLS Policies

#### Policy 1: SELECT - View Projects
```sql
CREATE POLICY "projects_select_policy" 
ON public.projects FOR SELECT TO authenticated
USING (true);
```
- **Who**: All authenticated users
- **Action**: Can view all projects
- **Condition**: User must be authenticated

#### Policy 2: INSERT - Create Projects
```sql
CREATE POLICY "projects_insert_policy" 
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner', 'controller')
    AND profiles.is_active = true
  )
);
```
- **Who**: Admin, Owner, Controller
- **Action**: Can create new projects
- **Condition**: 
  - Must have role: admin, owner, or controller
  - Account must be active

#### Policy 3: UPDATE - Edit Projects (Role-based)
```sql
CREATE POLICY "projects_update_policy" 
ON public.projects FOR UPDATE TO authenticated
USING (
  -- Admin: Can update all projects
  -- Owner: Can update all projects
  -- Controller PLANNING: Can update projects with UIC = PLANNING or PLANNING & DEPLOYMENT
  -- Controller DEPLOYMENT: Can update projects with UIC = DEPLOYMENT or PLANNING & DEPLOYMENT
)
```
- **Who**: Admin, Owner, Controller (with division restriction)
- **Action**: Can edit projects
- **Condition**:
  - **Admin**: Can update ALL projects
  - **Owner**: Can update ALL projects
  - **Controller (PLANNING)**: Can only update projects with:
    - `uic IN ('PLANNING', 'PLANNING & DEPLOYMENT')`
  - **Controller (DEPLOYMENT)**: Can only update projects with:
    - `uic IN ('DEPLOYMENT', 'PLANNING & DEPLOYMENT')`
  - Account must be active

#### Policy 4: DELETE - Archive Projects
```sql
CREATE POLICY "projects_delete_policy" 
ON public.projects FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
    AND profiles.is_active = true
  )
);
```
- **Who**: Admin, Owner only
- **Action**: Can delete/archive projects
- **Condition**:
  - Must have role: admin or owner
  - Account must be active

---

### 📊 Progress Mapping

| Progress Task | Status | UIC | Division Access |
|--------------|--------|-----|-----------------|
| REJECT | CANCEL | PLANNING & DEPLOYMENT | All |
| PENDING / HOLD | PENDING | PLANNING & DEPLOYMENT | All |
| CREATED BOQ | DESAIN | PLANNING | PLANNING |
| CHECKED BOQ | DESAIN | PLANNING | PLANNING |
| BEP | DESAIN | PLANNING | PLANNING |
| APPROVED | DESAIN | PLANNING | PLANNING |
| SPK SURVEY | DESAIN | PLANNING | PLANNING |
| SURVEY | DESAIN | PLANNING | PLANNING |
| DRM | DESAIN | PLANNING | PLANNING |
| APPROVED BOQ DRM | DESAIN | PLANNING | PLANNING |
| SPK | DESAIN | PLANNING | PLANNING |
| MOS | CONSTRUCTION | DEPLOYMENT | DEPLOYMENT |
| PERIZINAN | CONSTRUCTION | DEPLOYMENT | DEPLOYMENT |
| CONST | CONSTRUCTION | DEPLOYMENT | DEPLOYMENT |
| COMMTEST | CONSTRUCTION | DEPLOYMENT | DEPLOYMENT |
| UT | CONSTRUCTION | DEPLOYMENT | DEPLOYMENT |
| REKON | RFS | DEPLOYMENT | DEPLOYMENT |
| BAST | RFS | DEPLOYMENT | DEPLOYMENT |
| BALOP | RFS | DEPLOYMENT | DEPLOYMENT |
| DONE | DEPLOYMENT | DEPLOYMENT | DEPLOYMENT |

---

### 🔧 Auto-Calculated Fields

#### 1. `idle_port` (Generated Column)
```sql
idle_port INTEGER GENERATED ALWAYS AS (port - COALESCE(port_terisi, 0)) STORED
```
- Automatically calculated: `Port - Port Terisi`
- Cannot be manually set

#### 2. `occupancy` (Application-level)
```typescript
const occupancy = ((portTerisi / port) * 100).toFixed(2) + '%';
```
- Calculated in application: `(Port Terisi ÷ Port) × 100%`
- Format: "XX.XX%"

#### 3. `capex` (Application-level)
```typescript
const capex = 'Rp ' + (port * 850_000).toLocaleString('id-ID');
```
- Calculated in application: `Port × 850,000`
- Format: "Rp XXX.XXX.XXX"

#### 4. `target_active` (Application-level)
```typescript
target_active = start_pekerjaan + toc (days)
```
- Calculated: Start Pekerjaan + TOC days
- Auto-calculated when both fields are set

#### 5. `uic` & `status` (Application-level)
```typescript
// Auto-set based on progress mapping
const mapping = PROGRESS_MAPPING[progress.split('.')[0]];
uic = mapping.uic;
status = mapping.status;
```

---

### 🚀 Migration Steps

1. **Run migration**:
```bash
# If using Supabase CLI
supabase db push

# Or execute SQL directly in Supabase Dashboard
# SQL Editor → New Query → Paste migration content → Run
```

2. **Verify table structure**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

3. **Verify RLS policies**:
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'projects';
```

4. **Test permissions**:
```sql
-- Test as controller with PLANNING division
-- Should be able to update projects with UIC = 'PLANNING'
UPDATE projects SET remark = 'test' WHERE uic = 'PLANNING';

-- Should fail for DEPLOYMENT projects
UPDATE projects SET remark = 'test' WHERE uic = 'DEPLOYMENT';
```

---

### ✅ Checklist

- [x] All form fields mapped to database columns
- [x] Proper data types (TEXT, INTEGER, DATE, TIMESTAMPTZ)
- [x] Constraints (NOT NULL, CHECK, UNIQUE, max length)
- [x] Generated columns for auto-calculated fields
- [x] Indexes for query performance
- [x] RLS enabled
- [x] SELECT policy (all authenticated)
- [x] INSERT policy (admin, owner, controller only)
- [x] UPDATE policy (role-based + division-based)
- [x] DELETE policy (admin, owner only)
- [x] Auto-update timestamp trigger
- [x] Proper documentation and comments

---

### 📝 Notes

1. **Field Number vs Date**:
   - `toc` and `bep` are INTEGER fields (not dates) as specified in requirements
   - They represent number of days and months respectively

2. **Division-based Access**:
   - PLANNING division can only edit projects in PLANNING phase (progress 01-09)
   - DEPLOYMENT division can only edit projects in DEPLOYMENT phase (progress 10-18)
   - REJECT and PENDING can be edited by both divisions

3. **Auto-calculated Fields**:
   - Some fields are calculated at database level (generated columns)
   - Some are calculated at application level before submission
   - Both approaches ensure data consistency

4. **Circulir Status**:
   - Defaults to 'ongoing'
   - Can be changed to 'hold' or 'reject' during project lifecycle
   - Independent from progress status
