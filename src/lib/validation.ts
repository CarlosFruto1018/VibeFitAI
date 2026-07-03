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
