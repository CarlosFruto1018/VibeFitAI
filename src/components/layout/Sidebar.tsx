"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, TrendingUp, History, MessageCircle, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("home"), icon: LayoutDashboard },
    { href: "/progress", label: t("progress"), icon: TrendingUp },
    { href: "/history", label: t("history"), icon: History },
    { href: "/chat", label: t("chatFull"), icon: MessageCircle },
    { href: "/settings", label: t("profile"), icon: User },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-outline-variant/70 flex-col py-6 px-4 z-40 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-xl shrink-0" />
        <div>
          <span className="text-base font-black text-on-surface tracking-tight">VibeFitAI</span>
          <p className="text-[10px] text-on-surface-variant/70 leading-none mt-0.5">{t("tagline")}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              )}
            >
              <Icon
                size={17}
                className={cn(active ? "text-inverse-primary" : "text-on-surface-variant/70")}
                strokeWidth={active ? 2.5 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Record button */}
      <Link
        href="/record"
        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <Plus size={16} strokeWidth={2.5} />
        {t("recordWorkout")}
      </Link>
    </aside>
  );
}
