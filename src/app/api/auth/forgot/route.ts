import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateResetToken, hashToken } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ForgotSchema = z.object({ email: z.string().email().max(254) });

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// Respuesta idéntica exista o no la cuenta: no revela correos registrados.
const NEUTRAL = {
  ok: true,
  message: "Si ese correo tiene una cuenta, te llegará un enlace para restablecer tu contraseña.",
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

    // Un solo token vigente por correo; se guarda hasheado.
    const token = generateResetToken();
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    await db.insert(verificationTokens).values({
      identifier: email,
      token: hashToken(token),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    const resetUrl = `${base}/restablecer?token=${token}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json(NEUTRAL);
  } catch (err) {
    logger.error("POST /api/auth/forgot", "Error al iniciar el restablecimiento", err);
    // También neutral en error: el atacante no distingue nada por la respuesta.
    return NextResponse.json(NEUTRAL);
  }
}
