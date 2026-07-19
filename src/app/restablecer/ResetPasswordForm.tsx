"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 " +
  "dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500";

const CODE_FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-sm transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 " +
  "dark:bg-slate-800 dark:border-slate-700 dark:text-white";

const SUBMIT =
  "w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white dark:bg-white dark:text-primary dark:hover:bg-white/90 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-primary/15 dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

type Step = "code" | "password";

export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const tForm = useTranslations("auth.form");
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {t("missingEmail")}{" "}
        <Link href="/login" className="underline underline-offset-2 font-medium">
          {t("requestCode")}
        </Link>{" "}
        {t("fromLogin")}
      </div>
    );
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.verify"));
        return;
      }
      setStep("password");
    } catch {
      setError(t("errors.connection"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (password !== confirm) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.reset"));
        // El código pudo caducar entre pasos: regresa a pedirlo de nuevo.
        setStep("code");
        return;
      }
      setDone(true);
      // Entra directamente con la contraseña nueva.
      const login = await signIn("credentials", { email, password, redirect: false });
      if (!login?.error) window.location.href = "/dashboard";
    } catch {
      setError(t("errors.connection"));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy) return;
    setError(null);
    setResent(false);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setResent(true);
    } catch {
      setError(t("errors.connection"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-2 bg-primary-container/70 dark:bg-accent/10 rounded-xl px-4 py-3 text-sm text-on-primary-container dark:text-inverse-primary animate-fade-in">
        <CheckCircle size={16} className="shrink-0 mt-0.5" />
        <p>
          {t("done")}{" "}
          <Link href="/login" className="underline underline-offset-2 font-medium">
            {t("goToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  // Correo fijo, no editable: viene del enlace que se envió a esa dirección.
  const emailDisplay = (
    <div
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400"
      aria-label={tForm("labels.email")}
    >
      {email}
    </div>
  );

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="w-full flex flex-col gap-3 text-left">
        {emailDisplay}
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          autoComplete="one-time-code"
          required
          maxLength={6}
          disabled={busy}
          aria-label={t("codeLabel")}
          className={CODE_FIELD}
        />

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2 animate-fade-in">
            {error}
          </p>
        )}

        {resent && !error && (
          <p className="text-xs text-on-primary-container dark:text-inverse-primary bg-primary-container/70 dark:bg-accent/10 rounded-xl px-3 py-2 animate-fade-in">
            {t("resent")}
          </p>
        )}

        <button type="submit" disabled={busy || code.length !== 6} className={SUBMIT}>
          {busy ? <Loader2 size={15} className="animate-spin inline" /> : t("verifyCode")}
        </button>

        <button
          type="button"
          onClick={resendCode}
          disabled={busy}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {t("resendCode")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSetPassword} className="w-full flex flex-col gap-3 text-left">
      {emailDisplay}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("newPasswordPlaceholder")}
        autoComplete="new-password"
        required
        minLength={8}
        disabled={busy}
        aria-label={t("newPasswordPlaceholder")}
        autoFocus
        className={FIELD}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("confirmPasswordPlaceholder")}
        autoComplete="new-password"
        required
        minLength={8}
        disabled={busy}
        aria-label={t("confirmPasswordPlaceholder")}
        className={FIELD}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2 animate-fade-in">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={SUBMIT}>
        {busy ? <Loader2 size={15} className="animate-spin inline" /> : t("savePassword")}
      </button>

      <button
        type="button"
        onClick={() => setStep("code")}
        disabled={busy}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {t("backToCode")}
      </button>
    </form>
  );
}
