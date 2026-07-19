"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "forgot";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 " +
  "dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500";

const LABEL =
  "block text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-0.5";

const SUBMIT =
  "w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white dark:bg-white dark:text-primary dark:hover:bg-white/90 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-primary/15 dark:shadow-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";

export function EmailAuthCard({ defaultMode = "login" }: { defaultMode?: "login" | "register" }) {
  const t = useTranslations("auth.form");
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirmPassword("");
  }

  async function doLogin(loginEmail: string, loginPassword: string) {
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    if (res?.error) {
      setError(t("errors.loginFailed"));
      return;
    }
    window.location.href = "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await doLogin(email, password);
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setError(t("errors.passwordMismatch"));
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : t("errors.registerFailed"));
          return;
        }
        // Cuenta creada: entra directamente.
        await doLogin(email, password);
      } else {
        // mode === "forgot": pide el código y lleva a la página dedicada a
        // introducirlo — se mantiene separada del formulario de login.
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : t("errors.codeFailed"));
          return;
        }
        window.location.href = `/restablecer?email=${encodeURIComponent(email)}`;
      }
    } catch {
      setError(t("errors.connection"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      {/* Selector entrar / crear cuenta */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1" role="tablist">
        {([
          { id: "login", label: t("tabs.login") },
          { id: "register", label: t("tabs.register") },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => switchMode(tab.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              mode === tab.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "forgot" && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t("forgotHint")}
        </p>
      )}

      {mode === "register" && (
        <div>
          <label htmlFor="auth-name" className={LABEL}>{t("labels.name")}</label>
          <input
            id="auth-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("placeholders.name")}
            autoComplete="name"
            required
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className={LABEL}>{t("labels.email")}</label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholders.email")}
          autoComplete="email"
          required
          disabled={busy}
          className={FIELD}
        />
      </div>

      {mode !== "forgot" && (
        <div>
          <label htmlFor="auth-password" className={LABEL}>{t("labels.password")}</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? t("placeholders.passwordRegister") : t("placeholders.passwordLogin")}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            minLength={8}
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      {mode === "register" && (
        <div>
          <label htmlFor="auth-confirm-password" className={LABEL}>{t("labels.confirmPassword")}</label>
          <input
            id="auth-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("placeholders.confirmPassword")}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2 animate-fade-in">
          {error}
        </p>
      )}

      {notice && (
        <p className="flex items-start gap-2 text-xs text-on-primary-container dark:text-inverse-primary bg-primary-container/70 dark:bg-accent/10 rounded-xl px-3 py-2 animate-fade-in">
          <MailCheck size={14} className="shrink-0 mt-0.5" />
          {notice}
        </p>
      )}

      <button type="submit" disabled={busy} className={SUBMIT}>
        {busy ? (
          <Loader2 size={15} className="animate-spin inline" />
        ) : mode === "login" ? (
          t("submit.login")
        ) : mode === "register" ? (
          t("submit.register")
        ) : (
          t("submit.forgot")
        )}
      </button>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {t("forgotPassword")}
        </button>
      )}

      {mode === "forgot" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {t("backToLogin")}
        </button>
      )}
    </form>
  );
}
