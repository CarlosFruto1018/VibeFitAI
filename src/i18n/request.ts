import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

// Sin routing por URL (no hay /es /en en las rutas): el idioma se guarda en
// una cookie, igual que el patrón ya usado para tema (localStorage) y tz
// (cookie vía TimezoneSync). Server components y client components comparten
// el mismo idioma a través de NextIntlClientProvider en el layout raíz.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
