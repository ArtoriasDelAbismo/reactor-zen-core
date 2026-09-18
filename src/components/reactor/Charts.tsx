import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactorSample } from "@/lib/reactor";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

export function TrendChart({
  data,
  dataKey,
  color,
  domain,
  unit,
}: {
  data: ReactorSample[];
  dataKey: keyof ReactorSample;
  color: string;
  domain: [number, number];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" {...axis} minTickGap={40} />
        <YAxis domain={domain} {...axis} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => `t = ${v}s`}
          formatter={(v: number) => [`${v} ${unit}`, ""]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#g-${dataKey})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FuelChart({ data }: { data: ReactorSample[] }) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" {...axis} minTickGap={40} />
        <YAxis domain={[0, 100]} {...axis} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => `t = ${v}s`}
          formatter={(v: number) => [`${v} %`, "combustible"]}
        />
        <Line
          type="monotone"
          dataKey="fuel"
          stroke="var(--plasma)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
