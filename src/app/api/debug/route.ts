import { NextResponse } from "next/server";

// Endpoint de diagnóstico TEMPORAL para depurar el 500 de producción.
// Solo expone presencia de variables (booleanos) y el mensaje de error de
// auth() — nunca valores de secretos. Eliminar cuando el deploy funcione.
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    // Estas dos no son secretas (son URLs públicas) — el valor importa
    // porque un formato inválido revienta NextAuth al parsearla.
    AUTH_URL: process.env.AUTH_URL ?? null,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    VERCEL: !!process.env.VERCEL,
  };

  let authError: string | null = null;
  let authOk = false;
  try {
    const { auth } = await import("@/lib/auth");
    await auth();
    authOk = true;
  } catch (err) {
    authError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  return NextResponse.json({ env, authOk, authError });
}
