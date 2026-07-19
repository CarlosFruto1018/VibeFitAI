"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sliders, Scale, Ruler, Target, CalendarDays, Camera, LogOut, Trash2, CheckCircle, XCircle, Loader2, User, Languages } from "lucide-react";
import { cn, displayWeight, toKg, type WeightUnit } from "@/lib/utils";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useTranslations } from "next-intl";

interface Props {
  locale: Locale;
  profile: {
    name: string;
    image: string | null;
    preferredUnits: WeightUnit;
    bodyWeightKg: number | null;
    birthDate: string | null; // YYYY-MM-DD
    heightCm: number | null;
    weeklyGoal: number;
  };
  signOutAction: () => Promise<void>;
}

const LANGUAGE_OPTIONS: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

const FIELD =
  "bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 w-full";

const LABEL = "text-xs font-medium text-on-surface-variant flex items-center gap-1.5";

export function SettingsClient({ locale, profile, signOutAction }: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changingLocale, setChangingLocale] = useState<Locale | null>(null);

  function handleLocaleChange(next: Locale) {
    if (next === locale) return;
    setChangingLocale(next);
    // Cookie legible por next-intl en el servidor (mismo patrón que TimezoneSync
    // con `tz`); recarga completa para que los server components la tomen.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [heightCm, setHeightCm] = useState(profile.heightCm != null ? String(profile.heightCm) : "");
  const [weeklyGoal, setWeeklyGoal] = useState(profile.weeklyGoal);
  const [preferredUnits, setPreferredUnits] = useState<WeightUnit>(profile.preferredUnits);
  // El campo se edita siempre en la unidad seleccionada; el valor guardado
  // en profile.bodyWeightKg es kg canónico, se convierte solo al mostrarlo.
  const [bodyWeight, setBodyWeight] = useState(
    profile.bodyWeightKg != null ? String(displayWeight(profile.bodyWeightKg, profile.preferredUnits)) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"ok" | "error" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmWord = t("confirmDeleteWord");
  const canDelete = deleteConfirmText === confirmWord;

  function handleUnitChange(next: WeightUnit) {
    // Convierte el número que ya está en el campo para que siga representando
    // el mismo peso real en la nueva unidad, en vez de reinterpretarlo.
    setBodyWeight((current) => {
      if (current === "") return current;
      const parsed = parseFloat(current);
      if (Number.isNaN(parsed)) return current;
      const kg = toKg(parsed, preferredUnits);
      return String(displayWeight(kg, next));
    });
    setPreferredUnits(next);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(t("errors.photoTooLarge"));
      return;
    }
    setUploadingPhoto(true);
    try {
      const presignRes = await fetch(
        `/api/input/presign?type=image&mimeType=${encodeURIComponent(file.type)}`
      );
      const presign = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        setPhotoError(typeof presign.error === "string" ? presign.error : t("errors.uploadPrepareFailed"));
        return;
      }
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) {
        setPhotoError(t("errors.uploadFailed"));
        return;
      }
      const patchRes = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey: presign.storageKey }),
      });
      if (!patchRes.ok) {
        setPhotoError(t("errors.savePhotoFailed"));
        return;
      }
      router.refresh();
    } catch {
      setPhotoError(t("errors.uploadConnectionError"));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          preferredUnits,
          bodyWeightKg: bodyWeight ? toKg(parseFloat(bodyWeight), preferredUnits) : undefined,
          birthDate: birthDate || null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          weeklyGoal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(typeof data.error === "string" ? data.error : null);
        setSaveStatus("error");
        return;
      }
      setSaveStatus("ok");
      router.refresh();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/account", { method: "DELETE" });
      await signOutAction();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-widest px-1 -mb-1">
        {t("accountSettings")}
      </h3>

      {/* Perfil personal */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <User size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">{t("profile.title")}</h2>
            <p className="text-[11px] text-on-surface-variant">{t("profile.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-outline-variant/50" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black">
                {profile.name[0]?.toUpperCase() ?? "A"}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {uploadingPhoto ? t("uploadingPhoto") : t("changePhoto")}
              </button>
              <p className="text-[10px] text-on-surface-variant/70">{t("photoHint")}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
              aria-label={t("choosePhoto")}
            />
          </div>

          {photoError && (
            <p className="text-xs text-error bg-error-container/60 rounded-xl px-3 py-2 animate-fade-in">{photoError}</p>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-name" className={LABEL}>{t("name")}</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
              className={FIELD}
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-birthdate" className={LABEL}>
              <CalendarDays size={12} />
              {t("birthDate")}
            </label>
            <input
              id="profile-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={FIELD}
            />
          </div>
        </div>
      </section>

      {/* Idioma */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <Languages size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">{t("language.title")}</h2>
            <p className="text-[11px] text-on-surface-variant">{t("language.subtitle")}</p>
          </div>
        </div>
        <div className="p-4 flex gap-1.5">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleLocaleChange(opt.id)}
              disabled={changingLocale !== null}
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
      </section>

      {/* Preferencias de entrenamiento */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center">
            <Sliders size={15} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">{t("training.title")}</h2>
            <p className="text-[11px] text-on-surface-variant">{t("training.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Meta semanal */}
          <div className="flex flex-col gap-2">
            <label className={LABEL}>
              <Target size={12} />
              {t("weeklyGoal")}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWeeklyGoal((g) => Math.max(1, g - 1))}
                aria-label={t("decreaseGoal")}
                className="w-9 h-9 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-black font-mono text-on-surface">{weeklyGoal}</span>
              <button
                type="button"
                onClick={() => setWeeklyGoal((g) => Math.min(14, g + 1))}
                aria-label={t("increaseGoal")}
                className="w-9 h-9 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-colors active:scale-95"
              >
                +
              </button>
              <span className="text-xs text-on-surface-variant">{t("daysPerWeek")}</span>
            </div>
          </div>

          {/* Units */}
          <div className="flex flex-col gap-2">
            <label className={LABEL}>{t("weightUnits")}</label>
            <div className="flex gap-1.5">
              {(["kg", "lb"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => handleUnitChange(unit)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    preferredUnits === unit
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Body weight */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-weight" className={LABEL}>
              <Scale size={12} />
              {t("bodyWeight", { unit: preferredUnits })}
            </label>
            <input
              id="profile-weight"
              type="number"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder={t("bodyWeightPlaceholder")}
              className={FIELD}
            />
          </div>

          {/* Estatura */}
          <div className="flex flex-col gap-2">
            <label htmlFor="profile-height" className={LABEL}>
              <Ruler size={12} />
              {t("height")}
            </label>
            <input
              id="profile-height"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder={t("heightPlaceholder")}
              min={80}
              max={250}
              className={FIELD}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 shadow-sm shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>

          {saveStatus && (
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm rounded-xl py-2 px-3 text-center",
              saveStatus === "ok" ? "text-on-primary-container bg-primary-container/70" : "text-error bg-error-container/60"
            )}>
              {saveStatus === "ok"
                ? <><CheckCircle size={14} /> {t("changesSaved")}</>
                : <><XCircle size={14} className="shrink-0" /> {saveError ?? t("saveError")}</>
              }
            </div>
          )}
        </div>
      </section>

      {/* Sign out */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-error-container/70 hover:bg-error-container text-error text-sm font-semibold transition-colors active:scale-[0.98]"
        >
          <LogOut size={15} />
          {t("signOut")}
        </button>
      </form>

      {/* Danger zone */}
      <section className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-outline-variant/40">
          <Trash2 size={14} className="text-on-surface-variant" />
          <h2 className="text-sm font-semibold text-on-surface">{t("deleteAccount.title")}</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t("deleteWarning")}
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:border-red-200 hover:text-red-500 hover:bg-red-50/50 transition-colors"
            >
              {t("deleteMyAccount")}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-red-700">{t("confirmDeleteTitle")}</p>
                <p className="text-xs text-red-500/80">
                  {t("confirmDeleteHint")}{" "}
                  <span className="font-mono font-bold tracking-wider">{confirmWord}</span>{" "}
                  {t("confirmDeleteSuffix")}
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={confirmWord}
                autoComplete="off"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent font-mono tracking-widest transition-all"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium transition-colors hover:bg-slate-200"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {deleting ? t("deleting") : t("deleteMyAccount")}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
