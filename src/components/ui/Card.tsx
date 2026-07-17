import { cn } from "@/lib/utils";

// Superficie base de la app: consolida el patrón repetido
// `bg-white border border-slate-100 rounded-2xl shadow-sm` de todas las páginas.
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white border border-outline-variant/70 rounded-2xl shadow-card", className)}>
      {children}
    </div>
  );
}
