import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/* `next build` evalúa los módulos de las rutas al recolectar page data, sin
 * las env vars de runtime. Durante el build usamos una URL placeholder (nunca
 * se conecta: neon-http solo hace fetch al ejecutar una query); en runtime
 * real la ausencia de DATABASE_URL sigue siendo un error inmediato. */
const dbUrl = process.env.DATABASE_URL;
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!dbUrl && !isBuild) {
  throw new Error("DATABASE_URL no está configurada");
}

const sql = neon(dbUrl || "postgresql://build:placeholder@build.invalid/build");

export const db = drizzle(sql, { schema });

export type DB = typeof db;
