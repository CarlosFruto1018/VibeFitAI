import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateResetCode, hashToken } from "@/lib/password";
import { sendPasswordResetCodeEmail } from "@/lib/email";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ForgotSchema = z.object({ email: z.string().email().max(254) });

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos — más corto que el enlace anterior porque un código de 6 dígitos es más fácil de adivinar

// Respuesta idéntica exista o no la cuenta: no revela correos registrados.
const NEUTRAL = {
  ok: true,
  message: "Si ese correo tiene una cuenta, te llegará un código de 6 dígitos para restablecer tu contraseña.",
};

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
    const rl = await checkRateLimit(`ip:${ip}`, "forgot", 5, 300);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    const body = await req.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Correo no válido" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return NextResponse.json(NEUTRAL);

    // Un solo código vigente por correo; se guarda hasheado.
    const code = generateResetCode();
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    await db.insert(verificationTokens).values({
      identifier: email,
      token: hashToken(code),
      expires: new Date(Date.now() + CODE_TTL_MS),
    });

    await sendPasswordResetCodeEmail(email, code);

    return NextResponse.json(NEUTRAL);
  } catch (err) {
    logger.error("POST /api/auth/forgot", "Error al iniciar el restablecimiento", err);
    // También neutral en error: el atacante no distingue nada por la respuesta.
    return NextResponse.json(NEUTRAL);
  }
}
