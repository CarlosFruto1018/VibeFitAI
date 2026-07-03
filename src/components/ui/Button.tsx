import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-200",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
  destructive: "bg-red-500 hover:bg-red-400 text-white shadow-sm shadow-red-200",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl font-semibold text-sm py-3 px-4 transition-colors disabled:opacity-40 disabled:pointer-events-none";

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(BASE, VARIANTS[variant], className);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, cn("rounded-full px-5 py-2.5", className))}>
      {children}
    </Link>
  );
}
