"use client";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  variant?: "light" | "dark";
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  label,
  variant = "dark",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const center = size / 2;

  const trackColor = variant === "dark" ? "rgba(255,255,255,0.12)" : "rgba(19,27,46,0.08)";
  const strokeColor = variant === "dark" ? "#bec6e0" : "#4648d4";
  const textColor = variant === "dark" ? "text-white" : "text-on-surface";
  const subColor = variant === "dark" ? "text-white/60" : "text-on-surface-variant";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black leading-none ${textColor}`}>{Math.round(progress)}%</span>
        {label && <span className={`text-[10px] mt-0.5 ${subColor}`}>{label}</span>}
      </div>
    </div>
  );
}
