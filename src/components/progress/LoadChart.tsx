"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { displayWeight, type WeightUnit } from "@/lib/utils";

interface DataPoint {
  date: string;
  weightKg: number;
  reps: number;
}

interface LoadChartProps {
  data: DataPoint[];
  exerciseName: string;
  unit?: WeightUnit;
}

export function LoadChart({ data, exerciseName, unit = "kg" }: LoadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Sin datos suficientes
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "d MMM", { locale: es }),
    weightKg: displayWeight(d.weightKg, unit),
  }));

  const first = formatted[0].weightKg;
  const last = formatted[formatted.length - 1].weightKg;
  const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-900">{exerciseName}</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pct >= 0 ? "bg-primary-container text-on-primary-container" : "bg-error-container/60 text-error"}`}>
          {pct >= 0 ? "+" : ""}{pct}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit={unit} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "none", borderRadius: 10, color: "#f8fafc", fontSize: 12, padding: "6px 12px" }}
            labelStyle={{ color: "#94a3b8", fontSize: 11 }}
            formatter={(v) => [`${v} ${unit}`, "Carga máx."]}
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="#4648d4"
            strokeWidth={2}
            dot={{ fill: "#4648d4", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#4648d4", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
