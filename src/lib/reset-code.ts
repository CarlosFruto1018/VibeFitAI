import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db/client";
import { verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/password";

/** Comprueba que `code` sea el código vigente para `email`, sin consumirlo.
 *  Compartido por /api/auth/verify-code (solo valida) y /api/auth/reset
 *  (valida y además actualiza la contraseña + borra el token). */
export async function isResetCodeValid(email: string, code: string): Promise<boolean> {
  const stored = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, email),
  });

  const provided = Buffer.from(hashToken(code));
  const expected = stored ? Buffer.from(stored.token) : Buffer.alloc(provided.length);

  return (
    !!stored &&
    stored.expires > new Date() &&
    provided.length === expected.length &&
    timingSafeEqual(provided, expected)
  );
}
