"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, MailCheck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "forgot" | "reset";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 " +
  "dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500";

const CODE_FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-sm transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 " +
  "dark:bg-slate-800 dark:border-slate-700 dark:text-white";

const LABEL =
  "block text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-0.5";

const SUBMIT =
  "w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white dark:bg-white dark:text-primary dark:hover:bg-white/90 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-primary/15 dark:shadow-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";

export function EmailAuthCard({ defaultMode = "login" }: { defaultMode?: "login" | "register" }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

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
      setError("Correo o contraseña incorrectos.");
      return;
    }
    window.location.href = "/dashboard";
  }

  async function requestCode(targetEmail: string) {
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "No pudimos enviar el código.");
      return false;
    }
    return true;
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
          setError("Las contraseñas no coinciden.");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "No pudimos crear tu cuenta.");
          return;
        }
        // Cuenta creada: entra directamente.
        await doLogin(email, password);
      } else if (mode === "forgot") {
        const ok = await requestCode(email);
        if (!ok) return;
        setMode("reset");
        setNotice("Te enviamos un código de 6 dígitos. Revisa tu correo.");
      } else {
        // mode === "reset"
        if (newPassword !== confirmNewPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: code.trim(), password: newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "No pudimos restablecer tu contraseña.");
          return;
        }
        setResetDone(true);
        // Entra directamente con la contraseña nueva.
        const login = await signIn("credentials", { email, password: newPassword, redirect: false });
        if (!login?.error) window.location.href = "/dashboard";
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const ok = await requestCode(email);
      if (ok) setNotice("Te enviamos un código nuevo.");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "reset" && resetDone) {
    return (
      <div className="flex items-start gap-2 bg-primary-container/70 dark:bg-accent/10 rounded-xl px-4 py-3 text-sm text-on-primary-container dark:text-inverse-primary animate-fade-in">
        <CheckCircle size={16} className="shrink-0 mt-0.5" />
        <p>Contraseña actualizada. Entrando a tu cuenta...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      {/* Selector entrar / crear cuenta — oculto durante el flujo de restablecimiento */}
      {(mode === "login" || mode === "register") && (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1" role="tablist">
          {([
            { id: "login", label: "Entrar" },
            { id: "register", label: "Crear cuenta" },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => switchMode(t.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                mode === t.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {mode === "forgot" && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Escribe tu correo y te enviaremos un código de 6 dígitos para confirmar que eres tú y elegir una
          contraseña nueva.
        </p>
      )}

      {mode === "reset" && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Enviamos un código a <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
          Escríbelo abajo junto con tu nueva contraseña.
        </p>
      )}

      {mode === "register" && (
        <div>
          <label htmlFor="auth-name" className={LABEL}>Nombre completo</label>
          <input
            id="auth-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            autoComplete="name"
            required
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      {mode !== "reset" && (
        <div>
          <label htmlFor="auth-email" className={LABEL}>Correo electrónico</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@ejemplo.com"
            autoComplete="email"
            required
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      {mode === "reset" && (
        <div>
          <label htmlFor="auth-code" className={LABEL}>Código de 6 dígitos</label>
          <input
            id="auth-code"
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
            className={CODE_FIELD}
          />
        </div>
      )}

      {(mode === "login" || mode === "register") && (
        <div>
          <label htmlFor="auth-password" className={LABEL}>Contraseña</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
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
          <label htmlFor="auth-confirm-password" className={LABEL}>Confirmar contraseña</label>
          <input
            id="auth-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={busy}
            className={FIELD}
          />
        </div>
      )}

      {mode === "reset" && (
        <>
          <div>
            <label htmlFor="auth-new-password" className={LABEL}>Nueva contraseña</label>
            <input
              id="auth-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={busy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="auth-confirm-new-password" className={LABEL}>Confirmar nueva contraseña</label>
            <input
              id="auth-confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={busy}
              className={FIELD}
            />
          </div>
        </>
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
          "Entrar →"
        ) : mode === "register" ? (
          "Crear Cuenta →"
        ) : mode === "forgot" ? (
          "Enviarme el código"
        ) : (
          "Guardar contraseña →"
        )}
      </button>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      {mode === "forgot" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Volver a iniciar sesión
        </button>
      )}

      {mode === "reset" && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={resendCode}
            disabled={busy}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Reenviar código
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Cancelar
          </button>
        </div>
      )}
    </form>
  );
}
