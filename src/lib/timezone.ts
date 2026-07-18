import { cookies, headers } from "next/headers";

/**
 * Zona horaria del usuario para cálculos de fecha en el servidor.
 * Prioridad: cookie `tz` (la fija TimezoneSync desde el navegador — fuente
 * más fiable) → header de geolocalización de Vercel → UTC.
 * Sin esto, "hoy" se calcula en UTC y a partir de las 19:00 de GMT-5 todas
 * las fechas aparecen un día adelantadas.
 */
export async function getUserTimeZone(): Promise<string> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const fromCookie = cookieStore.get("tz")?.value;
  if (fromCookie && isValidTimeZone(fromCookie)) return fromCookie;

  const fromHeader = headerStore.get("x-vercel-ip-timezone");
  if (fromHeader && isValidTimeZone(fromHeader)) return fromHeader;

  return "UTC";
}

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
