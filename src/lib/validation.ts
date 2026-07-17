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

// ── Subida de archivos ──────────────────────────────────────────
// Allowlist de MIME → extensión. El bucket R2 es público: sin esta
// restricción se podría subir HTML/JS y servirlo desde nuestro dominio.
export const ALLOWED_UPLOAD_MIME: Record<"audio" | "image", Record<string, string>> = {
  audio: {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  },
  image: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  },
};

/** Extensión segura para un MIME permitido, o null si no está en la allowlist.
 *  Ignora parámetros tipo `;codecs=opus` que añade MediaRecorder. */
export function uploadExtensionFor(type: "audio" | "image", mimeType: string): string | null {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return ALLOWED_UPLOAD_MIME[type][base] ?? null;
}

/** Valida que una storage key generada por el presign pertenezca al usuario
 *  y no contenga rutas raras. Formato: `<userId>/<type>/<timestamp>-<nanoid>.<ext>` */
export function isOwnedStorageKey(key: string, userId: string, type: "audio" | "image"): boolean {
  if (!key.startsWith(`${userId}/${type}/`)) return false;
  return /^[A-Za-z0-9_-]+\/(audio|image)\/[A-Za-z0-9_-]+\.[a-z0-9]{2,5}$/.test(key);
}
