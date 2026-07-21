"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Locale } from "@/i18n/config";
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher";

const LANGUAGE_OPTIONS: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

interface LanguageSwitcherProps {
  locale: Locale;
  /** "full" — botones anchos con nombre completo (Settings).
   *  "compact" — pastilla chica con el código (ES/EN), para barras de navegación. */
  variant?: "full" | "compact";
  className?: string;
}

export function LanguageSwitcher({ locale, variant = "full", className }: LanguageSwitcherProps) {
  const { changingLocale, setLocale } = useLocaleSwitcher(locale);
  const busy = changingLocale !== null;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-0.5 bg-surface-container-low rounded-full p-0.5", className)}>
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            disabled={busy}
            aria-label={opt.label}
            aria-current={locale === opt.id}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              locale === opt.id
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {changingLocale === opt.id && <Loader2 size={10} className="animate-spin" />}
            {opt.id}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1.5", className)}>
      {LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLocale(opt.id)}
          disabled={busy}
          aria-current={locale === opt.id}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            locale === opt.id
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          )}
        >
          {changingLocale === opt.id && <Loader2 size={12} className="animate-spin" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
