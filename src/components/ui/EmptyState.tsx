import { Card } from "./Card";
import { ButtonLink } from "./Button";

// Empty state consistente (historial, progreso, dashboard).
export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
      <p className="text-xs text-slate-400 mb-5">{description}</p>
      {children}
      {actionHref && actionLabel && <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>}
    </Card>
  );
}
