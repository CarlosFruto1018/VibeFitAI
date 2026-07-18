import { db } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { WeightUnit } from "@/lib/utils";

export async function getWeightUnit(userId: string): Promise<WeightUnit> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    columns: { preferredUnits: true },
  });
  return profile?.preferredUnits === "lb" ? "lb" : "kg";
}
