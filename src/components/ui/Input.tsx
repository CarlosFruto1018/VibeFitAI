"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const FIELD_CLASSES =
  "w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 shadow-sm leading-relaxed";

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

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input id={id} className={cn(FIELD_CLASSES, className)} {...props} />
    </div>
  );
}
