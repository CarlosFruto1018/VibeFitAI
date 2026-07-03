import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, personalRecords } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { subDays, format, getWeek } from "date-fns";
import { es } from "date-fns/locale";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { Flame, Trophy, Dumbbell, ChevronRight } from "lucide-react";
import Link from "next/link";

const WEEKLY_GOAL = 5;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const firstName = session!.user?.name?.split(" ")[0] ?? "Atleta";
  const initial = firstName[0]?.toUpperCase() ?? "A";

  const now = new Date();
  const weekStart = subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1);
  weekStart.setHours(0, 0, 0, 0);

  const [recentSessions, prs] = await Promise.all([
    db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: desc(sessions.startedAt),
      limit: 30,
    }),
    db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, userId),
      with: { exercise: true },
      orderBy: desc(personalRecords.achievedAt),
      limit: 3,
    }),
  ]);

  const weekSessions = recentSessions.filter(
    (s) => new Date(s.startedAt) >= weekStart
  );
  const weeklyProgress = Math.round((weekSessions.length / WEEKLY_GOAL) * 100);
  const remaining = Math.max(0, WEEKLY_GOAL - weekSessions.length);

  const weekVolumeKg = weekSessions.reduce((acc, s) => acc + (s.totalVolumeKg ?? 0), 0);

  const trainedDays = new Set(
    weekSessions.map((s) => {
      const dow = new Date(s.startedAt).getDay();
      return dow === 0 ? 6 : dow - 1;
    })
  );

  const sortedDates = recentSessions
    .map((s) => format(new Date(s.startedAt), "yyyy-MM-dd"))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse();
  let streak = 0;
  let checkDate = format(now, "yyyy-MM-dd");
  for (const d of sortedDates) {
    if (d === checkDate) {
      streak++;
      const prev = new Date(checkDate);
      prev.setDate(prev.getDate() - 1);
      checkDate = format(prev, "yyyy-MM-dd");
    } else break;
  }

  const chartData = recentSessions
    .filter((s) => s.totalVolumeKg && s.totalVolumeKg > 0)
    .slice(0, 15)
    .reverse()
    .map((s) => ({
      date: format(new Date(s.startedAt), "dd/MM"),
      volume: Math.round(s.totalVolumeKg ?? 0),
    }));

  const dayName = format(now, "EEEE", { locale: es });
  const weekNum = getWeek(now);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[--color-on-surface-variant] capitalize font-medium">{dayName} · Semana {weekNum}</p>
          <h1 className="text-2xl font-black text-[--color-on-surface] mt-0.5">¡Vamos, {firstName}!</h1>
        </div>
        <Link
          href="/settings"
          className="w-10 h-10 rounded-full bg-[--color-primary] flex items-center justify-center text-[--color-on-primary] text-sm font-bold ring-2 ring-white shadow-sm"
        >
          {initial}
        </Link>
      </div>

      {/* Hero card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 overflow-hidden shadow-xl shadow-slate-900/20">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[--color-primary]/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[--color-primary]/15 rounded-full blur-2xl" />

        <div className="relative flex items-center gap-5">
          <CircularProgress progress={weeklyProgress} size={110} strokeWidth={9} variant="dark" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 font-medium mb-1 uppercase tracking-wide">Meta semanal</p>
            <p className="text-4xl font-black text-white leading-none">
              {weekSessions.length}<span className="text-white/30 text-2xl">/{WEEKLY_GOAL}</span>
            </p>
            <p className="text-sm text-white/50 mt-2">
              {remaining > 0
                ? `Te falta${remaining > 1 ? "n" : ""} ${remaining} sesión${remaining > 1 ? "es" : ""}`
                : "¡Meta cumplida esta semana! 🎉"}
            </p>
            <Link
              href="/record"
              className="inline-flex items-center gap-1.5 mt-3 bg-[--color-primary] hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-full transition-opacity shadow-sm"
            >
              + Registrar sesión
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative flex gap-px mt-5 bg-white/5 rounded-2xl overflow-hidden">
          <div className="flex-1 flex flex-col items-center gap-1 py-3">
            <Dumbbell size={14} className="text-[--color-inverse-primary]" />
            <p className="text-base font-black text-white leading-none">
              {Math.round(weekVolumeKg).toLocaleString("es")}
            </p>
            <p className="text-[10px] text-white/40">kg esta semana</p>
          </div>
          <div className="w-px bg-white/5" />
          <div className="flex-1 flex flex-col items-center gap-1 py-3">
            <Flame size={14} className="text-orange-400" />
            <p className="text-base font-black text-white leading-none">{streak}</p>
            <p className="text-[10px] text-white/40">días seguidos</p>
          </div>
          {prs.length > 0 && (
            <>
              <div className="w-px bg-white/5" />
              <div className="flex-1 flex flex-col items-center gap-1 py-3">
                <Trophy size={14} className="text-yellow-400" />
                <p className="text-base font-black text-white leading-none">{prs.length}</p>
                <p className="text-[10px] text-white/40">récords</p>
              </div>
            </>
          )}
        </div>

        {/* Días de la semana */}
        <div className="relative mt-4 flex gap-1.5">
          {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-medium text-white/30">{day}</span>
              <div
                className={`w-full h-1 rounded-full transition-colors ${
                  trainedDays.has(i) ? "bg-[--color-inverse-primary]" : "bg-white/10"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Récords recientes */}
      {prs.length > 0 && (
        <div className="bg-[--color-surface-container-lowest] rounded-2xl shadow-sm border border-[--color-outline-variant] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-[--color-on-surface] flex items-center gap-2">
              <Trophy size={15} className="text-yellow-500" />
              Récords recientes
            </p>
          </div>
          <div className="divide-y divide-[--color-surface-container-low]">
            {prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[--color-on-surface]">{pr.exercise?.displayName ?? "Ejercicio"}</p>
                  <p className="text-xs text-[--color-on-surface-variant]">
                    {format(new Date(pr.achievedAt), "d MMM", { locale: es })}
                  </p>
                </div>
                <p className="text-sm font-black text-[--color-primary]">
                  {pr.value}{pr.metric === "weight_kg" ? " kg" : ` ${pr.metric}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="bg-[--color-surface-container-lowest] rounded-2xl p-4 shadow-sm border border-[--color-outline-variant]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[--color-on-surface]">Volumen · últimas sesiones</p>
              <p className="text-xs text-[--color-on-surface-variant] mt-0.5">kg levantados por sesión</p>
            </div>
            {(() => {
              const first = chartData[0].volume;
              const last = chartData[chartData.length - 1].volume;
              const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
              return (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  pct >= 0
                    ? "bg-[--color-primary-container] text-[--color-on-primary-container]"
                    : "bg-red-50 text-red-600"
                }`}>
                  {pct >= 0 ? "+" : ""}{pct}%
                </span>
              );
            })()}
          </div>
          <DashboardChart data={chartData} />
        </div>
      )}

      {/* Sesiones recientes */}
      {recentSessions.length > 0 && (
        <div className="bg-[--color-surface-container-lowest] rounded-2xl shadow-sm border border-[--color-outline-variant] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-[--color-on-surface]">Sesiones recientes</p>
            <Link href="/history" className="text-xs text-[--color-primary] font-medium flex items-center gap-0.5">
              Ver todo <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-[--color-surface-container-low]">
            {recentSessions.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[--color-surface-container-low] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[--color-primary-container] flex items-center justify-center">
                    <Dumbbell size={14} className="text-[--color-on-primary-container]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[--color-on-surface]">
                      {format(new Date(s.startedAt), "EEEE d MMM", { locale: es })}
                    </p>
                    <p className="text-xs text-[--color-on-surface-variant]">
                      {s.totalVolumeKg ? `${Math.round(s.totalVolumeKg).toLocaleString("es")} kg` : "Sin volumen"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[--color-outline]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentSessions.length === 0 && (
        <div className="bg-[--color-surface-container-lowest] rounded-2xl p-10 text-center shadow-sm border border-[--color-outline-variant]">
          <div className="w-14 h-14 rounded-2xl bg-[--color-primary-container] flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={24} className="text-[--color-on-primary-container]" />
          </div>
          <p className="text-sm font-semibold text-[--color-on-surface] mb-1">¡Empieza hoy!</p>
          <p className="text-xs text-[--color-on-surface-variant] mb-5">
            Registra tu primer entrenamiento para ver tu progreso aquí.
          </p>
          <Link
            href="/record"
            className="inline-flex items-center gap-1.5 bg-[--color-primary] text-[--color-on-primary] text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            + Registrar entrenamiento
          </Link>
        </div>
      )}
    </div>
  );
}
