import { scrypt, randomBytes, randomInt, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

// Formato almacenado: scrypt$<salt hex>$<hash hex>
// scrypt (crypto nativo de Node) evita añadir bcrypt como dependencia.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Los códigos de restablecimiento se guardan hasheados: si alguien lee la
// tabla verification_tokens no puede usar el código directamente.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Código numérico de 6 dígitos (con ceros a la izquierda) para verificar
 *  por correo — más fácil de teclear a mano que un token largo. */
export function generateResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
