import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WeightUnit = "kg" | "lb";

const KG_TO_LB = 2.2046226218;

/** kg es la unidad canónica de almacenamiento en toda la DB (columnas *_kg). */
export function convertWeight(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

/** Convierte un valor ingresado por el usuario en `unit` de vuelta a kg para guardar. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? value / KG_TO_LB : value;
}

/** Peso convertido a `unit` y redondeado a 1 decimal — para mostrar/editar. */
export function displayWeight(kg: number, unit: WeightUnit): number {
  return Math.round(convertWeight(kg, unit) * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit = "kg", decimals = 0): string {
  const converted = convertWeight(kg, unit);
  const factor = 10 ** decimals;
  const rounded = Math.round(converted * factor) / factor;
  return `${rounded.toLocaleString("es")} ${unit}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
