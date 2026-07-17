"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: { date: string; volume: number }[];
}

export function DashboardChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4648d4" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4648d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#76777d" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "#131b2e",
            border: "none",
            borderRadius: 10,
            color: "#f8fafc",
            fontSize: 12,
            padding: "6px 12px",
          }}
          formatter={(v) => [`${v} kg`, "Volumen"]}
          cursor={{ stroke: "#e0e3e5", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#4648d4"
          strokeWidth={2}
          fill="url(#volumeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#4648d4", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
