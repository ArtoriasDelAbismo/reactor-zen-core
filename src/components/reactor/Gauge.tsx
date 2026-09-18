import { motion } from "motion/react";

interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  label: string;
  unit: string;
  tone?: "neon" | "warn" | "danger" | "accent" | "plasma";
  size?: number;
}

const toneVar: Record<string, string> = {
  neon: "var(--neon)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  accent: "var(--accent)",
  plasma: "var(--plasma)",
};

export function Gauge({
  value,
  min = 0,
  max,
  label,
  unit,
  tone = "neon",
  size = 190,
}: GaugeProps) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const radius = 68;
  const circumference = Math.PI * radius * 1.5; // 270deg arc
  const color = toneVar[tone];

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 180 180" width={size} height={size * 0.82}>
        <g transform="rotate(135 90 90)">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="var(--grid)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference} 999`}
          />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference} 999`}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </g>
        <text
          x="90"
          y="92"
          textAnchor="middle"
          fill={color}
          style={{ fontSize: 30, fontWeight: 700, filter: `drop-shadow(0 0 10px ${color})` }}
        >
          {Math.round(value).toLocaleString("es")}
        </text>
        <text x="90" y="112" textAnchor="middle" fill="var(--muted-foreground)" fontSize="13">
          {unit}
        </text>
      </svg>
      <span className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
