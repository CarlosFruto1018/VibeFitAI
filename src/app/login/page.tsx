import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Dumbbell, Mic, TrendingUp, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmailAuthCard } from "@/components/landing/EmailAuthCard";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const defaultMode = mode === "register" ? "register" : "login";
  const t = await getTranslations("auth");

  const FEATURES = [
    { icon: Mic, title: t("panel.features.logging.title"), desc: t("panel.features.logging.desc") },
    { icon: TrendingUp, title: t("panel.features.progress.title"), desc: t("panel.features.progress.desc") },
    { icon: MessageCircle, title: t("panel.features.chat.title"), desc: t("panel.features.chat.desc") },
  ];

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-float border border-outline-variant/40">
        {/* Panel oscuro — narrativa, como el diseño de Stitch */}
        <section className="relative hidden lg:flex flex-col justify-between bg-primary p-10 text-white overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 bg-accent/30 rounded-full blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-16 w-72 h-72 bg-inverse-primary/15 rounded-full blur-3xl" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />

          <div className="relative flex items-center gap-2">
            <Dumbbell size={20} className="text-inverse-primary" />
            <span className="font-black text-lg tracking-tight">VibeFitAI</span>
          </div>

          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight leading-[1.1] mb-4 [text-wrap:balance]">
              {t("panel.titleLine1")}
              <br />
              {t("panel.titleLine2")}
            </h1>
            <p className="text-sm text-white/60 max-w-sm mb-10 leading-relaxed">
              {t("panel.subtitle")}
            </p>

            <div className="flex flex-col gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <f.icon size={16} className="text-inverse-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{f.title}</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-[10px] font-mono text-white/30">
            {t("panel.copyright")}
          </p>
        </section>

        {/* Panel de formulario */}
        <section className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Logo en móvil */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Dumbbell size={22} className="text-primary" />
            <span className="font-black text-xl tracking-tight text-primary">VibeFitAI</span>
          </div>

          <div className="max-w-sm w-full mx-auto">
            <h2 className="text-2xl font-black tracking-tight text-on-surface text-center lg:text-left">
              {t("form.title")}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1.5 mb-7 text-center lg:text-left [text-wrap:pretty]">
              {t("form.subtitle")}
            </p>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant hover:border-outline text-on-surface font-semibold py-3 rounded-xl text-sm shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <GoogleIcon />
                {t("form.continueWithGoogle")}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-[10px] font-mono font-semibold text-on-surface-variant/70 uppercase tracking-widest">
                {t("form.orContinueWithEmail")}
              </span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <EmailAuthCard defaultMode={defaultMode} />

            <p className="text-[11px] text-on-surface-variant/80 mt-6 text-center leading-relaxed">
              {t("form.termsPrefix")}{" "}
              <Link href="/terminos" className="font-semibold text-accent hover:underline underline-offset-2">
                {t("form.termsLink")}
              </Link>{" "}
              {t("form.and")}{" "}
              <Link href="/privacidad" className="font-semibold text-accent hover:underline underline-offset-2">
                {t("form.privacyLink")}
              </Link>{" "}
              {t("form.termsSuffix")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
