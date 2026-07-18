import { Suspense } from "react";
import Link from "next/link";
import { Dumbbell, KeyRound, ArrowLeft } from "lucide-react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Restablecer contraseña · VibeFitAI",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-background text-on-surface flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Dumbbell size={22} className="text-inverse-primary" />
          </div>
          <span className="text-lg font-black tracking-tight text-primary">VibeFitAI</span>
        </div>

        {/* Tarjeta */}
        <section className="w-full bg-white border border-outline-variant/50 rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center">
          <div className="mb-4 w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
            <KeyRound size={26} className="text-primary" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-center mb-2 [text-wrap:balance]">
            Confirma tu código
          </h1>
          <p className="text-sm text-on-surface-variant text-center mb-6 leading-relaxed [text-wrap:pretty]">
            Escribe el código de 6 dígitos que te enviamos por correo, junto con la contraseña que quieres
            usar a partir de ahora.
          </p>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>

          <Link
            href="/login"
            className="mt-6 flex items-center gap-2 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <ArrowLeft size={13} />
            Volver al inicio de sesión
          </Link>
        </section>

        <footer className="mt-6 text-center">
          <p className="text-[11px] text-on-surface-variant/60">
            Tecnología VibeFitAI © 2026 •{" "}
            <Link href="/privacidad" className="hover:text-on-surface-variant transition-colors">
              Privacidad
            </Link>{" "}
            •{" "}
            <Link href="/terminos" className="hover:text-on-surface-variant transition-colors">
              Términos
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
