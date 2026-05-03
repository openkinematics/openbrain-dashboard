"use client";

import { cn } from "@/lib/utils";

interface GaugeChartProps {
  /** Current value. */
  value: number;
  /** Min value (default 0). */
  min?: number;
  /** Max value (default 100). */
  max?: number;
  /** Label drawn under the value. */
  label?: string;
  /** Suffix appended to the value (e.g. `%`, `°C`). */
  suffix?: string;
  /** Threshold above which the gauge turns warning. */
  warnAt?: number;
  /** Threshold above which the gauge turns destructive. */
  dangerAt?: number;
  className?: string;
}

/**
 * Lightweight SVG gauge — doesn't depend on recharts so the Health page can
 * render dozens of these without bloating the bundle.
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  suffix = "",
  warnAt,
  dangerAt,
  className,
}: GaugeChartProps) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -Math.PI + pct * Math.PI; // semicircle from -π to 0

  const cx = 60;
  const cy = 60;
  const r = 48;
  const sx = cx + Math.cos(-Math.PI) * r;
  const sy = cy + Math.sin(-Math.PI) * r;
  const ex = cx + Math.cos(angle) * r;
  const ey = cy + Math.sin(angle) * r;
  const largeArc = pct > 0.5 ? 1 : 0;

  const color =
    dangerAt !== undefined && value >= dangerAt
      ? "var(--destructive)"
      : warnAt !== undefined && value >= warnAt
        ? "var(--warning)"
        : "var(--primary)";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg viewBox="0 0 120 75" className="w-full max-w-[140px]">
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          stroke="var(--muted)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-foreground"
          style={{ font: "600 18px var(--font-orbitron, system-ui)" }}
        >
          {Number.isFinite(value) ? value.toFixed(0) : "—"}
          <tspan style={{ font: "400 10px system-ui", fill: "var(--muted-foreground)" }}>
            {suffix}
          </tspan>
        </text>
      </svg>
      {label && <p className="text-muted-foreground text-xs">{label}</p>}
    </div>
  );
}
