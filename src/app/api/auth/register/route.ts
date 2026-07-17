import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

export async function POST(req: NextRequest) {
  try {
    // Ruta pública: se limita por IP, no por usuario.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
    const rl = await checkRateLimit(`ip:${ip}`, "register", 5, 300);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos no válidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return NextResponse.json(
        { error: "Ese correo ya tiene una cuenta. Inicia sesión o restablece tu contraseña." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(users).values({ email, name: parsed.data.name.trim(), passwordHash });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("POST /api/auth/register", "Error al crear la cuenta", err);
    return NextResponse.json({ error: "No pudimos crear tu cuenta. Intenta de nuevo." }, { status: 500 });
  }
}
