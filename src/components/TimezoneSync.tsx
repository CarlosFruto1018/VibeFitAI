"use client";

import { useEffect } from "react";

/** Publica la zona horaria real del navegador en la cookie `tz` para que los
 *  server components calculen fechas en la hora local del usuario. */
export function TimezoneSync() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.includes(`tz=${tz}`)) {
        document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {
      /* sin soporte de Intl: el servidor usará su fallback */
    }
  }, []);

  return null;
}
