import { z } from "zod";

// Schemas compartidos entre rutas API y tests.
// (Los route.ts de Next solo pueden exportar handlers HTTP, por eso viven aquí.)

export const SessionPatchSchema = z
  .object({
    status: z.enum(["active", "closed"]).optional(),
    summaryText: z.string().max(2000).optional(),
  })
  .refine((d) => d.status !== undefined || d.summaryText !== undefined, {
    message: "Debes enviar al menos un campo: status o summaryText",
  });

export type SessionPatch = z.infer<typeof SessionPatchSchema>;

export const SetPatchSchema = z
  .object({
    reps: z.number().int().min(0).max(1000).nullable().optional(),
    weightKg: z.number().min(0).max(2000).nullable().optional(),
    durationSec: z.number().int().min(0).max(86400).nullable().optional(),
    distanceM: z.number().min(0).max(1000000).nullable().optional(),
    rpe: z.number().min(1).max(10).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Debes enviar al menos un campo a modificar",
  });

export type SetPatch = z.infer<typeof SetPatchSchema>;
