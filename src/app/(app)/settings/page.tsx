import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { userProfiles, sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { getUserTimeZone, nowInTimeZone } from "@/lib/timezone";
import { Flame, Dumbbell } from "lucide-react";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [profile, recentSessions] = await Promise.all([
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    }),
    db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: desc(sessions.startedAt),
      limit: 90,
    }),
  ]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const user = session!.user!;
  const tz = await getUserTimeZone();

  // Racha de días consecutivos con entrenamiento
  const sortedDates = recentSessions
    .map((s) => format(new TZDate(s.startedAt, tz), "yyyy-MM-dd"))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse();
  let streak = 0;
  let checkDate = format(nowInTimeZone(tz), "yyyy-MM-dd");
  for (const d of sortedDates) {
    if (d === checkDate) {
      streak++;
      // Ancla a mediodía en la TZ del usuario: "yyyy-MM-dd" a secas se parsea
      // como medianoche UTC y al formatear puede retroceder un día.
      const prev = new TZDate(`${checkDate}T12:00:00`, tz);
      prev.setDate(prev.getDate() - 1);
      checkDate = format(prev, "yyyy-MM-dd");
    } else break;
  }

  return (
    <div className="flex flex-col gap-7 pt-2">
      {/* Cabecera de perfil centrada, como el diseño de Stitch */}
      <section className="flex flex-col items-center gap-4 text-center">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-float"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-primary border-4 border-white shadow-float flex items-center justify-center text-white text-4xl font-black">
            {user.name?.[0]?.toUpperCase() ?? "A"}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">{user.name}</h1>
          <p className="mt-1.5 text-xs text-on-surface-variant">{user.email}</p>
        </div>
      </section>

      {/* Stats bento */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/50 flex flex-col items-center justify-center gap-1 shadow-card">
          <Flame size={18} className="text-accent" />
          <span className="text-2xl font-black font-mono text-on-surface">{streak}</span>
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
            Días Racha
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/50 flex flex-col items-center justify-center gap-1 shadow-card">
          <Dumbbell size={18} className="text-accent" />
          <span className="text-2xl font-black font-mono text-on-surface">{recentSessions.length}</span>
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
            Sesiones
          </span>
        </div>
      </section>

      {/* Ajustes */}
      <SettingsClient
        profile={{
          preferredUnits: profile?.preferredUnits === "lb" ? "lb" : "kg",
          bodyWeightKg: profile?.bodyWeightKg ?? null,
        }}
        signOutAction={handleSignOut}
      />

      {/* Banner Reporte IA — navy */}
      <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-lg shadow-primary/20 mb-2">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-accent/40 rounded-full blur-3xl" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-inverse-primary/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-1.5">
          <h4 className="text-lg font-bold">Optimiza tus resultados</h4>
          <p className="text-sm text-white/70 max-w-[85%]">
            Revisa tu progresión de cargas, récords y análisis de VibeFitAI.
          </p>
          <Link
            href="/progress"
            className="mt-3 self-start bg-primary-container text-on-primary-container px-6 py-2 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95"
          >
            Ver Reporte IA
          </Link>
        </div>
      </section>
    </div>
  );
}
