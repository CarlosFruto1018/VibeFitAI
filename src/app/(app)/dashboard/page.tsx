import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, personalRecords, userProfiles, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { subDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { es } from "date-fns/locale";
import { getUserTimeZone, nowInTimeZone } from "@/lib/timezone";
import { getWeightUnit } from "@/lib/get-weight-unit";
import { Sparkles, Dumbbell, CalendarDays, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { cn, convertWeight, formatWeight } from "@/lib/utils";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Todas las fechas en la zona horaria del usuario: el servidor corre en UTC
  // y sin esto "hoy" (y la semana entera) se corre un día por la noche.
  const [tz, unit] = await Promise.all([getUserTimeZone(), getWeightUnit(userId)]);
  const now = nowInTimeZone(tz);
  const weekStart = subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1);
  weekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = subDays(weekStart, 7);
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const [recentSessions, prs, profile, dbUser] = await Promise.all([
    db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: desc(sessions.startedAt),
      limit: 60,
    }),
    db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, userId),
      with: { exercise: true },
      orderBy: desc(personalRecords.achievedAt),
      limit: 1,
    }),
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
      columns: { weeklyGoal: true },
    }),
    // Nombre/foto frescos de la DB: la sesión JWT no se refresca al editarlos.
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true, image: true },
    }),
  ]);

  const weeklyGoal = profile?.weeklyGoal ?? 5;
  const firstName = (dbUser?.name ?? session!.user?.name)?.split(" ")[0] ?? "Atleta";
  const initial = firstName[0]?.toUpperCase() ?? "A";

  const weekSessions = recentSessions.filter((s) => new Date(s.startedAt) >= weekStart);
  const prevWeekSessions = recentSessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= prevWeekStart && d < weekStart;
  });

  const weekVolumeKg = weekSessions.reduce((acc, s) => acc + (s.totalVolumeKg ?? 0), 0);
  const prevWeekVolumeKg = prevWeekSessions.reduce((acc, s) => acc + (s.totalVolumeKg ?? 0), 0);
  const weekPct =
    prevWeekVolumeKg > 0 ? Math.round(((weekVolumeKg - prevWeekVolumeKg) / prevWeekVolumeKg) * 100) : null;

  // Volumen por día de esta semana para las barras L–D
  const dayVolumes = Array.from({ length: 7 }, () => 0);
  for (const s of weekSessions) {
    const dow = new TZDate(s.startedAt, tz).getDay();
    dayVolumes[dow === 0 ? 6 : dow - 1] += s.totalVolumeKg ?? 0;
  }
  const maxDayVolume = Math.max(...dayVolumes, 1);

  const monthSessions = recentSessions.filter((s) => {
    const d = new TZDate(s.startedAt, tz);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const remaining = Math.max(0, weeklyGoal - weekSessions.length);
  const topPr = prs[0];

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Saludo */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">¡Hola, {firstName}!</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {weekSessions.length >= weeklyGoal
              ? "Tu progreso esta semana es excepcional."
              : weekSessions.length > 0
                ? "Buen ritmo. Sigue así esta semana."
                : "Semana nueva, primera sesión pendiente."}
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Ir a tu perfil"
          className="hidden md:flex w-10 h-10 rounded-full bg-primary items-center justify-center text-on-primary text-sm font-bold ring-2 ring-white shadow-sm overflow-hidden"
        >
          {dbUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dbUser.image} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </Link>
      </section>

      {/* Actividad Semanal — barras L–D */}
      <section className="bg-white border border-outline-variant/50 rounded-2xl p-5 shadow-card">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h3 className="text-xs font-medium text-on-surface-variant">Actividad Semanal</h3>
            <p className="text-2xl font-black text-on-surface font-mono mt-0.5">
              {Math.round(convertWeight(weekVolumeKg, unit)).toLocaleString("es")}{" "}
              <span className="text-base font-bold">{unit}</span>
            </p>
          </div>
          {weekPct !== null && (
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                weekPct >= 0 ? "bg-primary-container text-on-primary-container" : "bg-error-container/60 text-error"
              )}
            >
              {weekPct >= 0 ? "+" : ""}
              {weekPct}% vs semana pasada
            </span>
          )}
        </div>
        <div className="flex items-end justify-between h-28 gap-2">
          {dayVolumes.map((v, i) => {
            const isFuture = i > todayIdx;
            const h = v > 0 ? Math.max(12, Math.round((v / maxDayVolume) * 100)) : 6;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  "w-full rounded-t-lg transition-all",
                  i === todayIdx && v > 0
                    ? "bg-accent"
                    : v > 0
                      ? "bg-inverse-primary/70"
                      : isFuture
                        ? "bg-surface-container-low border border-dashed border-outline/40"
                        : "bg-surface-container-highest"
                )}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-medium text-on-surface-variant px-0.5">
          {DAY_LABELS.map((d) => (
            <span key={d} className="w-full text-center">{d}</span>
          ))}
        </div>
      </section>

      {/* Métricas — 2 tarjetas bento */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-outline-variant/50 rounded-2xl p-4 h-32 flex flex-col justify-between shadow-card">
          <Trophy size={18} className="text-accent" />
          <div>
            <p className="text-[11px] font-medium text-on-surface-variant">
              {topPr ? `Récord · ${topPr.exercise?.displayName ?? "Ejercicio"}` : "Récords"}
            </p>
            <p className="text-xl font-black text-on-surface font-mono">
              {topPr
                ? topPr.metric === "weight_kg"
                  ? formatWeight(topPr.value, unit, 1)
                  : topPr.value
                : "—"}
            </p>
          </div>
        </div>
        <div className="bg-white border border-outline-variant/50 rounded-2xl p-4 h-32 flex flex-col justify-between shadow-card">
          <CalendarDays size={18} className="text-accent" />
          <div>
            <p className="text-[11px] font-medium text-on-surface-variant">Total Mes</p>
            <p className="text-xl font-black text-on-surface font-mono">
              {monthSessions.length} <span className="text-sm font-bold">ses.</span>
            </p>
          </div>
        </div>
      </section>

      {/* VibeFitAI Insight — tarjeta navy */}
      <section className="relative overflow-hidden bg-primary rounded-2xl p-5 text-white shadow-lg shadow-primary/20">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/40 blur-3xl rounded-full" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-inverse-primary/20 blur-2xl rounded-full" />
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-inverse-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-inverse-primary">
              VibeFitAI Insight
            </span>
          </div>
          <h3 className="text-lg font-bold leading-tight">
            {weekSessions.length >= weeklyGoal
              ? "Meta semanal cumplida 🎉"
              : `Llevas ${weekSessions.length} de ${weeklyGoal} sesiones esta semana`}
          </h3>
          <p className="text-sm text-white/70">
            {remaining > 0
              ? `Te falta${remaining > 1 ? "n" : ""} ${remaining} sesión${remaining > 1 ? "es" : ""} para tu meta. Registra la próxima y mantén la racha.`
              : "Buen momento para revisar tu progresión de cargas y planear la próxima semana."}
          </p>
          <Link
            href="/progress"
            className="mt-2 self-start px-4 py-2 bg-white text-primary rounded-full text-xs font-semibold active:scale-95 transition-transform hover:bg-white/90"
          >
            Ver análisis
          </Link>
        </div>
      </section>

      {/* Sesiones Recientes */}
      {recentSessions.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-on-surface">Sesiones Recientes</h3>
            <Link href="/history" className="text-xs font-medium text-accent flex items-center gap-0.5">
              Ver todo <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentSessions.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="flex items-center gap-4 bg-white border border-outline-variant/50 p-3 rounded-xl hover:border-accent/40 transition-colors shadow-card"
              >
                <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center">
                  <Dumbbell size={17} className="text-on-surface" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface capitalize">
                    {format(new TZDate(s.startedAt, tz), "EEEE d MMM", { locale: es })}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {s.totalVolumeKg
                      ? `${formatWeight(s.totalVolumeKg, unit)} levantados`
                      : "Sin volumen registrado"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-outline" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nota del coach */}
      {recentSessions.length > 0 && (
        <section className="pb-4">
          <div className="bg-surface-container-high/50 rounded-2xl p-6 border border-dashed border-outline-variant flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Sparkles size={18} className="text-inverse-primary" />
            </div>
            <p className="text-sm text-on-surface italic max-w-xs [text-wrap:pretty]">
              «{firstName}, descansar bien hoy optimiza tu rendimiento en la próxima sesión. ¡Recupera!»
            </p>
          </div>
        </section>
      )}

      {/* Empty state / onboarding de usuario nuevo */}
      {recentSessions.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-card border border-outline-variant/50">
          <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={24} className="text-on-primary-container" />
          </div>
          <p className="text-sm font-semibold text-on-surface mb-1">¡Bienvenido, {firstName}!</p>
          <p className="text-xs text-on-surface-variant mb-5">
            Registra tu primer entrenamiento como prefieras:
          </p>
          <div className="flex flex-col gap-2 text-left max-w-xs mx-auto mb-6">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-5">🎙️</span>
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Voz</span> — di lo que hiciste: «4 series de press banca con 60 kilos»
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-5">📸</span>
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Foto</span> — a la pantalla de la máquina o tu hoja de rutina
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-5">⌨️</span>
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">Texto</span> — escríbelo como lo dirías, la IA lo entiende
              </p>
            </div>
          </div>
          <Link
            href="/record"
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            + Registrar mi primer entrenamiento
          </Link>
        </div>
      )}
    </div>
  );
}
