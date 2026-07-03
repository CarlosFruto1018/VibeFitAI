import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 20;

    const rows = await db.query.sessions.findMany({
      where: eq(sessions.userId, session.user.id),
      with: {
        workoutSets: {
          with: { exercise: true },
          orderBy: (s, { asc }) => asc(s.createdAt),
        },
      },
      orderBy: desc(sessions.startedAt),
      limit,
    });

    return NextResponse.json(rows);
  } catch (err) {
    logger.error("GET /api/sessions", "Error al listar sesiones", err);
    return NextResponse.json({ error: "Error al listar sesiones" }, { status: 500 });
  }
}
