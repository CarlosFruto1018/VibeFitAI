import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db/client";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, hashToken } from "@/lib/password";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ResetSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
    const rl = await checkRateLimit(`ip:${ip}`, "reset", 5, 300);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos no válidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const stored = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.identifier, email),
    });

    const provided = Buffer.from(hashToken(parsed.data.code));
    const expected = stored ? Buffer.from(stored.token) : Buffer.alloc(provided.length);
    const valid =
      !!stored &&
      stored.expires > new Date() &&
      provided.length === expected.length &&
      timingSafeEqual(provided, expected);

    if (!valid) {
      return NextResponse.json(
        { error: "El código no es válido o ya caducó. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db
      .update(users)
      // El enlace llegó a su correo: cuenta verificada.
      .set({ passwordHash, emailVerified: new Date() })
      .where(eq(users.email, email));

    // Token de un solo uso.
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("POST /api/auth/reset", "Error al restablecer la contraseña", err);
    return NextResponse.json({ error: "No pudimos restablecer tu contraseña. Intenta de nuevo." }, { status: 500 });
  }
}
