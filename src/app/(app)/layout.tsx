import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[--color-background] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-28 md:pb-10">
        <div className="max-w-2xl mx-auto px-4 pt-6 md:max-w-3xl lg:max-w-4xl">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
