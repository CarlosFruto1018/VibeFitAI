import { NextResponse } from "next/server";
import { createHash } from "crypto";

// Endpoint de diagnóstico TEMPORAL v2 — prueba desde dentro de producción:
// 1) si las credenciales de Google que tiene Vercel son válidas (token
//    endpoint distingue invalid_client de invalid_grant), y
// 2) si la base de datos acepta lecturas.
// Solo expone longitudes y hashes truncados, nunca valores. Eliminar al acabar.

const fp = (v: string | undefined) =>
  v ? { len: v.length, sha8: createHash("sha256").update(v).digest("hex").slice(0, 8) } : null;

export async function GET() {
  const fingerprints = {
    AUTH_GOOGLE_ID: fp(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: fp(process.env.AUTH_GOOGLE_SECRET),
    AUTH_SECRET: fp(process.env.AUTH_SECRET),
    DATABASE_URL: fp(process.env.DATABASE_URL),
  };

  // Prueba real contra Google con las credenciales del entorno de Vercel.
  let googleTest = "sin probar";
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID ?? "",
        client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
        grant_type: "authorization_code",
        code: "dummy-code-test",
        redirect_uri: "https://vibefitai.vercel.app/api/auth/callback/google",
      }),
    });
    const j = (await res.json()) as { error?: string };
    googleTest =
      j.error === "invalid_grant"
        ? "CREDENCIALES OK"
        : j.error === "invalid_client"
          ? "CREDENCIALES INVÁLIDAS"
          : `respuesta inesperada: ${j.error}`;
  } catch (err) {
    googleTest = `fetch falló: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Prueba de lectura de DB por la misma vía que usa el adapter.
  let dbTest = "sin probar";
  try {
    const { db } = await import("@/lib/db/client");
    await db.query.users.findFirst();
    dbTest = "LECTURA OK";
  } catch (err) {
    dbTest = `falló: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({ fingerprints, googleTest, dbTest });
}
