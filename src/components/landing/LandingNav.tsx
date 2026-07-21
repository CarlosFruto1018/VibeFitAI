import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function LandingNav() {
  const [t, rawLocale] = await Promise.all([getTranslations("landing.nav"), getLocale()]);
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const LINKS = [
    { href: "#caracteristicas", label: t("features") },
    { href: "#como-funciona", label: t("howItWorks") },
    { href: "/privacidad", label: t("privacy") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/50">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
          <Dumbbell size={20} className="text-primary" />
          <span className="font-black text-base tracking-tight text-primary">VibeFitAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} variant="compact" />
          <Link
            href="/login"
            className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
