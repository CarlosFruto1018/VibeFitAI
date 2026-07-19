import { NextRequest, NextResponse } from "next/server";
import { isResetCodeValid } from "@/lib/reset-code";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const VerifySchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});

// Solo confirma que el código sea válido — no lo consume ni cambia nada.
// El paso final (/api/auth/reset) vuelve a validar y ahí sí lo gasta,
// así que esta comprobación previa es solo para la UX de dos pasos.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
    const rl = await checkRateLimit(`ip:${ip}`, "verify-code", 5, 300);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos no válidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const valid = await isResetCodeValid(email, parsed.data.code);

    if (!valid) {
      return NextResponse.json(
        { error: "El código no es válido o ya caducó. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("POST /api/auth/verify-code", "Error al verificar el código", err);
    return NextResponse.json({ error: "No pudimos verificar el código. Intenta de nuevo." }, { status: 500 });
  }
}
