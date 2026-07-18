"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const FIELD_CLASSES =
  "w-full rounded-2xl bg-white border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-shadow duration-200 hover:border-outline focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 shadow-sm leading-relaxed";

// Textarea con label accesible (visualmente oculto por defecto).
export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea id={id} className={cn(FIELD_CLASSES, "resize-none", className)} {...props} />
    </div>
  );
}
