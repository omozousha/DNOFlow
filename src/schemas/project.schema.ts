import { z } from "zod";

export const projectSchema = z.object({
  regional: z.string().min(1),
  no_project: z.string().optional(),
  no_spk: z.string().optional(),
  pop: z.string().optional(),
  nama_project: z.string().min(1),
  mitra: z.string().optional(),

  toc: z.string().optional(),
  start_pekerjaan: z.string().optional(),
  target_active: z.string().optional(),
  tanggal_active: z.string().optional(),

  port: z.coerce.number().optional(),
  port_terisi: z.coerce.number().optional(),
  idle_port: z.coerce.number().optional(),
  occupancy: z.coerce.number().optional(),

  bep: z.string().optional(),
  target_bep: z.string().optional(),
  capex: z.string().optional(),
  revenue: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
