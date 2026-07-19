import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingClient } from "./OnboardingClient";

export const metadata = {
  title: "Bienvenido · VibeFitAI",
};

// Wizard de primera vez: solo para cuentas que aún no tienen perfil.
// Al completarlo (o saltarlo) se crea la fila de user_profiles y no vuelve a aparecer.
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
    columns: { userId: true },
  });
  if (profile) redirect("/dashboard");

  return <OnboardingClient defaultName={session.user.name?.split(" ")[0] ?? ""} />;
}
