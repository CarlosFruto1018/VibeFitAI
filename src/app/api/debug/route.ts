import { NextResponse } from "next/server";

// Diagnóstico TEMPORAL v3 — ejecuta las MISMAS operaciones de escritura que
// hace el adapter de NextAuth durante el callback de Google (createUser,
// getUserByAccount, linkAccount) con datos de prueba, y limpia al final.
// Eliminar cuando el login funcione.

const TEST_EMAIL = "debug-test@vibefitai.local";

export async function GET() {
  const steps: Record<string, string> = {};

  try {
    const { DrizzleAdapter } = await import("@auth/drizzle-adapter");
    const { db } = await import("@/lib/db/client");
    const { users, accounts, authSessions, verificationTokens } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const adapter = DrizzleAdapter(db, {
      usersTable: users,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accountsTable: accounts as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionsTable: authSessions as any,
      verificationTokensTable: verificationTokens,
    });

    // Limpieza previa por si quedó basura de una ejecución anterior.
    await db.delete(users).where(eq(users.email, TEST_EMAIL));

    let userId: string | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (adapter.createUser as any)({
        id: crypto.randomUUID(),
        email: TEST_EMAIL,
        emailVerified: null,
        name: "debug",
        image: null,
      });
      userId = created?.id;
      steps.createUser = `OK (id: ${String(userId).slice(0, 8)}…)`;
    } catch (err) {
      steps.createUser = `FALLÓ: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter.getUserByAccount as any)({ provider: "debug", providerAccountId: "debug-123" });
      steps.getUserByAccount = "OK";
    } catch (err) {
      steps.getUserByAccount = `FALLÓ: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`;
    }

    if (userId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adapter.linkAccount as any)({
          userId,
          type: "oidc",
          provider: "debug",
          providerAccountId: "debug-123",
          access_token: "test",
          expires_at: 1234567890,
          token_type: "bearer",
          scope: "openid",
          id_token: "test",
        });
        steps.linkAccount = "OK";
      } catch (err) {
        steps.linkAccount = `FALLÓ: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`;
      }
    }

    // Limpieza (accounts cae en cascada con el usuario).
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    steps.cleanup = "OK";
  } catch (err) {
    steps.setup = `FALLÓ: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`;
  }

  return NextResponse.json(steps);
}
