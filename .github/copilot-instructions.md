# Copilot Instructions for windsurf-project

## Project Overview
- This is a Next.js project (App Router) with TypeScript, using a modular structure under `src/`.
- UI components are organized in `src/components/`, with further subfolders for feature areas (e.g., `dashboard/`, `worksheet/`, `ui/`).
- Business logic and utilities are in `src/lib/` and `src/contexts/`.
- Database scripts and schemas are in `db/` and `src/schemas/`.
- Supabase is used for backend/database integration (see `supabase/` and `src/lib/supabase/`).

## Key Patterns & Conventions
- **Forms:** Use controlled React state for all form fields. See `src/components/worksheet/new-project-form.tsx` for a comprehensive example.
- **UI Composition:** Prefer composition of small, reusable components (see `src/components/ui/`).
- **Data Flow:** Data is passed top-down via props; context is used for auth (`src/contexts/auth-context.tsx`).
- **Progress/Status Mapping:** Project progress is mapped using a constant object (see `PROGRESS_MAPPING` in `new-project-form.tsx`).
- **Date Handling:** Store dates as ISO strings; empty fields are converted to `null` before submit.
- **Read-only fields:** Use `readOnly` and `className="bg-muted"` for computed or derived fields in forms.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (Next.js, port 3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (uses `eslint.config.mjs`)
- **Database:** Use scripts in `scripts/` and `db/` for inspection and queries. See `SUPABASE_LOCAL_SETUP.md` for local setup.
- **Component Additions:** Place new UI primitives in `src/components/ui/`, feature components in their respective folders.

## Integration Points
- **Supabase:** Config in `supabase/`, client logic in `src/lib/supabase/`.
- **App-wide styles:** `src/app/globals.css`.
- **Type Definitions:** Use `src/types/` for shared types, `src/schemas/` for Zod schemas.

## Project-Specific Notes
- **Regional/Progress lists:** Use the constants defined in forms/components for select options.
- **Field Helper:** Use the `Field` helper component for consistent form layout.
- **Do not mutate props directly;** always use state setters.

## References
- Main entry: `src/app/page.tsx`
- Example form: `src/components/worksheet/new-project-form.tsx`
- Auth context: `src/contexts/auth-context.tsx`
- Supabase setup: `SUPABASE_LOCAL_SETUP.md`

---
For more, see the README.md and in-code documentation. If unsure about a pattern, check for similar usage in `src/components/` or `src/app/`.
