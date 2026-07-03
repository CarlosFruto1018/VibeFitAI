import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL no está configurada");
}

const sql = neon(dbUrl);

export const db = drizzle(sql, { schema });

export type DB = typeof db;
