import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { SessionPatchSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const row = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, id), eq(sessions.userId, session.user.id)),
      with: {
        workoutSets: {
          with: { exercise: true },
          orderBy: (s, { asc }) => asc(s.createdAt),
        },
      },
    });

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    logger.error("GET /api/sessions/[id]", "Error al obtener la sesión", err);
    return NextResponse.json({ error: "Error al obtener la sesión" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SessionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status, summaryText } = parsed.data;

    const [updated] = await db
      .update(sessions)
      .set({
        ...(status !== undefined && { status }),
        ...(status === "closed" && { endedAt: new Date() }),
        ...(summaryText !== undefined && { summaryText }),
      })
      .where(and(eq(sessions.id, id), eq(sessions.userId, session.user.id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("PATCH /api/sessions/[id]", "Error al actualizar la sesión", err);
    return NextResponse.json({ error: "Error al actualizar la sesión" }, { status: 500 });
  }
}
