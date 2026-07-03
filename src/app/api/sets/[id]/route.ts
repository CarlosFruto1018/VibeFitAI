import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { workoutSets, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recalculateSessionVolume } from "@/lib/db/queries/workout";
import { SetPatchSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

// Busca el set y verifica que pertenezca al usuario (via su sesión).
async function findOwnedSet(setId: string, userId: string) {
  const set = await db.query.workoutSets.findFirst({
    where: eq(workoutSets.id, setId),
    columns: { id: true, sessionId: true },
  });
  if (!set) return null;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, set.sessionId),
    columns: { userId: true },
  });
  if (!session || session.userId !== userId) return null;

  return set;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const set = await findOwnedSet(id, authSession.user.id);
    if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = SetPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [updated] = await db
      .update(workoutSets)
      .set(parsed.data)
      .where(eq(workoutSets.id, id))
      .returning();

    await recalculateSessionVolume(set.sessionId);
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("PATCH /api/sets/[id]", "Error al actualizar el set", err);
    return NextResponse.json({ error: "Error al actualizar la serie" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const set = await findOwnedSet(id, authSession.user.id);
    if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.delete(workoutSets).where(eq(workoutSets.id, id));
    await recalculateSessionVolume(set.sessionId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("DELETE /api/sets/[id]", "Error al borrar el set", err);
    return NextResponse.json({ error: "Error al borrar la serie" }, { status: 500 });
  }
}
