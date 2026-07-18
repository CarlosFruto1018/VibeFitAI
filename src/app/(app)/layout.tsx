import Link from "next/link";
import { Dumbbell, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TimezoneSync } from "@/components/TimezoneSync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-background flex">
      <TimezoneSync />
      <Sidebar />

      {/* Top app bar móvil, como el diseño de Stitch */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="flex justify-between items-center h-14 px-4 max-w-md mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
            <Dumbbell size={20} className="text-primary" />
            <span className="text-lg font-black tracking-tight text-primary">VibeFitAI</span>
          </Link>
          <Link
            href="/settings"
            aria-label="Perfil y ajustes"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Bell size={19} />
          </Link>
        </div>
      </header>

      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto px-4 md:pt-6 md:max-w-3xl lg:max-w-4xl stagger-children">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
