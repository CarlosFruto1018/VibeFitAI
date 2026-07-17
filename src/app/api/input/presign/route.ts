import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/storage";
import { uploadExtensionFor } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const PresignSchema = z
  .object({
    type: z.enum(["audio", "image"]),
    mimeType: z.string().min(1).max(100),
  })
  // Solo MIME de la allowlist: el bucket es público y no debe alojar HTML/JS.
  .refine((d) => uploadExtensionFor(d.type, d.mimeType) !== null, {
    message: "Tipo de archivo no permitido",
  });

const r2Available =
  process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.includes("...");

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(session.user.id, "presign", 20);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    if (!r2Available) {
      return NextResponse.json(
        { error: "Almacenamiento de archivos (R2) no está configurado." },
        { status: 503 }
      );
    }

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = PresignSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { uploadUrl, key, publicUrl } = await createPresignedUploadUrl(
      session.user.id,
      parsed.data.type,
      parsed.data.mimeType
    );

    return NextResponse.json({ uploadUrl, storageKey: key, publicUrl });
  } catch (err) {
    logger.error("GET /api/input/presign", "Error al generar URL de subida", err);
    return NextResponse.json(
      { error: "No pudimos preparar la subida del archivo. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
