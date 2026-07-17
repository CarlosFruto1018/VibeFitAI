import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "destructive";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary hover:bg-primary/90 text-on-primary shadow-sm shadow-primary/15 focus-visible:ring-accent",
  secondary:
    "bg-white hover:bg-surface-container-low text-on-surface border border-outline-variant shadow-sm focus-visible:ring-accent",
  destructive:
    "bg-error hover:bg-error/90 text-on-error shadow-sm shadow-error/20 focus-visible:ring-error",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-2xl font-semibold text-sm py-3 px-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
