import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  users, accounts, authSessions, userProfiles,
  sessions, workoutSets, rawInputs, personalRecords,
  exerciseAliases, exercises,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { isOwnedStorageKey } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ProfileSchema = z.object({
  preferredUnits: z.enum(["kg", "lb"]).optional(),
  bodyWeightKg: z.number().positive().max(500).optional(),
  goals: z.array(z.string().max(200)).max(20).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  // Key del presign de R2 (nunca una URL arbitraria del cliente): se valida
  // pertenencia y la URL pública se reconstruye server-side, igual que en /api/input.
  imageKey: z.string().min(1).max(300).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
    .nullable()
    .optional(),
  heightCm: z.number().min(80).max(250).nullable().optional(),
  weeklyGoal: z.number().int().min(1).max(14).optional(),
});

function isReasonableBirthDate(value: string): boolean {
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const year = d.getUTCFullYear();
  const now = new Date();
  const age = now.getUTCFullYear() - year;
  return year >= 1920 && age >= 13 && d.getTime() < now.getTime();
}

// PATCH /api/account — update profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { name, imageKey, birthDate, ...profileData } = parsed.data;

    if (birthDate != null && !isReasonableBirthDate(birthDate)) {
      return NextResponse.json({ error: "La fecha de nacimiento no es válida." }, { status: 400 });
    }

    if (imageKey !== undefined && !isOwnedStorageKey(imageKey, userId, "image")) {
      return NextResponse.json({ error: "Imagen no válida" }, { status: 400 });
    }

    // name/image viven en users; el resto en user_profiles.
    const userChanges: Partial<{ name: string; image: string }> = {};
    if (name !== undefined) userChanges.name = name;
    if (imageKey !== undefined) userChanges.image = `${process.env.R2_PUBLIC_URL}/${imageKey}`;
    if (Object.keys(userChanges).length > 0) {
      await db.update(users).set(userChanges).where(eq(users.id, userId));
    }

    const profileChanges = { ...profileData, ...(birthDate !== undefined && { birthDate }) };
    if (Object.keys(profileChanges).length > 0) {
      await db
        .insert(userProfiles)
        .values({ userId, ...profileChanges })
        .onConflictDoUpdate({ target: userProfiles.userId, set: profileChanges });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("PATCH /api/account", "Error al actualizar el perfil", err);
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
  }
}

// DELETE /api/account — delete all user data and account
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    // Get session IDs first (workoutSets has no userId column)
    const userSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, userId));
    const sessionIds = userSessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      await db.delete(workoutSets).where(inArray(workoutSets.sessionId, sessionIds));
    }

    await db.delete(personalRecords).where(eq(personalRecords.userId, userId));
    await db.delete(rawInputs).where(eq(rawInputs.userId, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    // Estas FKs no tienen ON DELETE CASCADE: sin esto, borrar el usuario falla
    // si tiene aliases propios o ejercicios custom creados por él.
    await db.delete(exerciseAliases).where(eq(exerciseAliases.userId, userId));
    await db
      .update(exercises)
      .set({ createdByUserId: null })
      .where(eq(exercises.createdByUserId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("DELETE /api/account", "Error al borrar la cuenta", err);
    return NextResponse.json({ error: "Error al borrar la cuenta" }, { status: 500 });
  }
}
