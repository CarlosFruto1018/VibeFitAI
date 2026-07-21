"use client";

import { useEffect, useState } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** Cambia el idioma de la app escribiendo la cookie que lee next-intl en el
 *  servidor (mismo patrón que TimezoneSync con `tz`) y recarga para que los
 *  server components la tomen. La mutación de document.cookie vive en un
 *  efecto (no en el handler directo) para no tocar un valor externo durante
 *  el render (regla react-hooks/immutability). */
export function useLocaleSwitcher(currentLocale: Locale) {
  const [changingLocale, setChangingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!changingLocale) return;
    document.cookie = `${LOCALE_COOKIE}=${changingLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }, [changingLocale]);

  function setLocale(next: Locale) {
    if (next === currentLocale) return;
    setChangingLocale(next);
  }

  return { changingLocale, setLocale };
}
