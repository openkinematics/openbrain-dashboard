"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useTopic } from "@/components/ros";
import { GaugeChart } from "@/components/widgets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SystemHealthMsg } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { makeDemoHealth } from "@/lib/demo-health";

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds)) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function HealthInner() {
  const searchParams = useSearchParams();
  const demoForced = searchParams.get("demo") === "1";

  const { message: liveHealth } = useTopic<SystemHealthMsg>(
    "/system/health",
    "openbrain_msgs/SystemHealth",
    { throttleRate: 1000 },
  );

  // ── Demo data path ─────────────────────────────────────────────────────────
  // If `?demo=1` is in the URL, always synthesize. Otherwise wait 3 seconds
  // for a real message; if none arrives, fall back to demo so the page is
  // never just an empty "waiting…" state.
  const [demoActive, setDemoActive] = useState(demoForced);
  const [demoTick, setDemoTick] = useState(0);
  const generatorRef = useRef<ReturnType<typeof makeDemoHealth> | null>(null);

  useEffect(() => {
    if (liveHealth) {
      // Real data appeared — drop demo mode unless forced via URL.
      if (!demoForced) setDemoActive(false);
    }
  }, [liveHealth, demoForced]);

  useEffect(() => {
    if (demoForced) return;
    if (liveHealth) return;
    const t = setTimeout(() => setDemoActive(true), 3000);
    return () => clearTimeout(t);
  }, [demoForced, liveHealth]);

  useEffect(() => {
    if (!demoActive) return;
    if (!generatorRef.current) generatorRef.current = makeDemoHealth(8);
    const id = setInterval(() => setDemoTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [demoActive]);

  const health = useMemo<SystemHealthMsg | null>(() => {
    if (liveHealth && !demoForced) return liveHealth;
    if (demoActive && generatorRef.current) {
      // demoTick re-runs the memo; reading the generator advances state.
      void demoTick;
      return generatorRef.current.next();
    }
    return null;
  }, [liveHealth, demoForced, demoActive, demoTick]);

  const ramPct = health?.ram_total_bytes
    ? (health.ram_used_bytes / health.ram_total_bytes) * 100
    : 0;
  const cpuAvg = health?.cpu_per_core?.length
    ? health.cpu_per_core.reduce((a, b) => a + b, 0) / health.cpu_per_core.length
    : 0;

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-semibold md:text-2xl">Health</h1>
          {demoActive && (
            <Badge variant="warning" className="gap-1">
              <FlaskConical className="h-3 w-3" /> demo data
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs md:text-sm">
          {health
            ? `uptime ${formatUptime(health.uptime_s)} · 1 Hz`
            : "waiting for /system/health…"}
        </p>
      </div>

      {!liveHealth && demoActive && !demoForced && (
        <div className="border-warning/40 bg-warning/10 text-foreground flex flex-col gap-3 rounded-md border px-3 py-3 text-xs sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1">
            No <code>/system/health</code> messages received — showing synthetic data so you can
            preview the layout. Connect to an openbrain-ros backend to see live values.
          </p>
          <Button
            variant="ghost"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setDemoActive(false)}
          >
            Hide demo
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CPU avg</CardTitle>
            <CardDescription>{health?.cpu_per_core?.length ?? 0} cores</CardDescription>
          </CardHeader>
          <CardContent>
            <GaugeChart value={cpuAvg} suffix="%" warnAt={70} dangerAt={90} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CPU temp</CardTitle>
            <CardDescription>°C</CardDescription>
          </CardHeader>
          <CardContent>
            <GaugeChart
              value={health?.cpu_temp_c ?? 0}
              max={110}
              suffix="°C"
              warnAt={75}
              dangerAt={95}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">GPU</CardTitle>
            <CardDescription>load</CardDescription>
          </CardHeader>
          <CardContent>
            <GaugeChart value={health?.gpu_percent ?? 0} suffix="%" warnAt={70} dangerAt={95} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">RAM</CardTitle>
            <CardDescription>
              {health
                ? `${formatBytes(health.ram_used_bytes)} / ${formatBytes(health.ram_total_bytes)}`
                : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GaugeChart value={ramPct} suffix="%" warnAt={75} dangerAt={92} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Per-core CPU</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {(health?.cpu_per_core ?? []).map((value, i) => (
            <GaugeChart
              key={i}
              value={value}
              suffix="%"
              label={`core ${i}`}
              warnAt={80}
              dangerAt={95}
            />
          ))}
          {!health && <p className="text-muted-foreground text-xs">No data yet.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thermal zones</CardTitle>
          </CardHeader>
          <CardContent>
            {health?.thermal_zones?.length ? (
              <ul className="grid gap-1 text-sm">
                {health.thermal_zones.map((z) => (
                  <li
                    key={z.name}
                    className="border-border flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:items-center sm:justify-between sm:py-1"
                  >
                    <span className="text-muted-foreground break-words">{z.name}</span>
                    <span
                      className={
                        z.temp_c > 90
                          ? "text-destructive"
                          : z.temp_c > 75
                            ? "text-warning"
                            : "text-foreground"
                      }
                    >
                      {z.temp_c.toFixed(1)} °C
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Power rails</CardTitle>
          </CardHeader>
          <CardContent>
            {health?.power_rails?.length ? (
              <ul className="grid gap-1 text-sm">
                {health.power_rails.map((r) => (
                  <li
                    key={r.name}
                    className="border-border flex flex-col gap-1 border-b py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:py-1"
                  >
                    <span className="text-muted-foreground break-words">{r.name}</span>
                    <span className="font-mono text-xs sm:text-sm">
                      {r.voltage_v.toFixed(2)} V · {r.current_a.toFixed(2)} A ·{" "}
                      <span className="text-foreground">
                        {(r.voltage_v * r.current_a).toFixed(1)} W
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HealthPage() {
  // useSearchParams() requires a Suspense boundary so the route can prerender.
  return (
    <Suspense fallback={null}>
      <HealthInner />
    </Suspense>
  );
}
