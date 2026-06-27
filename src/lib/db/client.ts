import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;
console.log("[db] DATABASE_URL set:", !!dbUrl, "| starts with:", dbUrl?.slice(0, 30));

const sql = neon(dbUrl!, {
  fetchFunction: async (url: string, init: RequestInit) => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text();
      console.error("[db] Neon HTTP error:", res.status, text.slice(0, 300));
    }
    return res;
  },
});

export const db = drizzle(sql, { schema });

export type DB = typeof db;
