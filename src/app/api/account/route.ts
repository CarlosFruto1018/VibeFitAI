import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  users, accounts, authSessions, userProfiles,
  sessions, workoutSets, rawInputs, personalRecords,
  exerciseAliases, exercises,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ProfileSchema = z.object({
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredUnits: z.enum(["kg", "lb"]).optional(),
  bodyWeightKg: z.number().positive().max(500).optional(),
  goals: z.array(z.string().max(200)).max(20).optional(),
});

// PATCH /api/account — update profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    await db
      .insert(userProfiles)
      .values({ userId, ...parsed.data })
      .onConflictDoUpdate({ target: userProfiles.userId, set: parsed.data });

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
