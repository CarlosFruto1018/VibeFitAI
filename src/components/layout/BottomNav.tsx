"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Cuatro destinos, como el diseño de Stitch: Inicio, Registrar, Chat, Perfil.
// Progreso e Historial se alcanzan desde el dashboard («Ver análisis» / «Ver todo»).
const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/record", label: "Registrar", icon: PlusCircle },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/settings", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="bg-white/90 backdrop-blur-xl border-t border-outline-variant/40 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-2xl transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "bg-primary-container/60 text-primary"
                    : "text-on-surface-variant/70 hover:text-on-surface"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
