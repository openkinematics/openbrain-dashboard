"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, FlaskConical, Play, Repeat, Square, Trash2 } from "lucide-react";
import { MapView, type MapWaypoint } from "@/components/widgets";
import { useConnection, useService } from "@/components/ros";
import type { LoadMissionRequest, LoadMissionResponse, TriggerResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function MissionsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-6 text-sm">Loading missions…</div>}>
      <MissionsPageInner />
    </Suspense>
  );
}

function MissionsPageInner() {
  const searchParams = useSearchParams();
  const demoForced = searchParams.get("demo") === "1";
  const { status: rosStatus } = useConnection(false);
  const demoPreview = demoForced || rosStatus !== "connected";

  const [waypoints, setWaypoints] = useState<MapWaypoint[]>([]);
  const [loop, setLoop] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const load = useService<LoadMissionRequest, LoadMissionResponse>(
    "/missions/load",
    "openbrain_msgs/srv/LoadMission",
  );
  const start = useService<Record<string, never>, TriggerResponse>(
    "/missions/start",
    "std_srvs/srv/Trigger",
  );
  const stop = useService<Record<string, never>, TriggerResponse>(
    "/missions/stop",
    "std_srvs/srv/Trigger",
  );

  const handleAddWaypoint = (point: MapWaypoint) => {
    setWaypoints((prev) => [...prev, point]);
  };

  const move = (i: number, dir: -1 | 1) => {
    setWaypoints((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const remove = (i: number) => {
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleStart = async () => {
    if (waypoints.length === 0) {
      setStatusMsg("add at least one waypoint");
      return;
    }
    if (demoPreview) {
      setStatusMsg("Demo mode: mission Start is preview-only (no /missions/load).");
      return;
    }
    setStatusMsg(null);
    const loadRes = await load.call({
      waypoints: waypoints.map((w) => ({ x: w.x, y: w.y, yaw: 0 })),
      loop,
    });
    if (!loadRes?.success) {
      setStatusMsg(loadRes?.message ?? "failed to load mission");
      return;
    }
    const startRes = await start.call({});
    setStatusMsg(startRes?.message ?? (startRes?.success ? "mission started" : "start failed"));
  };

  const handleStop = async () => {
    if (demoPreview) {
      setStatusMsg("Demo mode: Stop is preview-only (no /missions/stop).");
      return;
    }
    const res = await stop.call({});
    setStatusMsg(res?.message ?? (res?.success ? "mission stopped" : "stop failed"));
  };

  const busy = load.loading || start.loading || stop.loading;

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-semibold md:text-2xl">Missions</h1>
          {demoPreview && (
            <Badge variant="warning" className="gap-1">
              <FlaskConical className="h-3 w-3" aria-hidden />
              demo
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs md:text-sm">Click the map to add a waypoint</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="h-[min(50svh,560px)] min-h-[260px] lg:col-span-8 lg:h-[60vh] lg:min-h-[420px]">
          <CardContent className="h-full p-2">
            <MapView onMapClick={handleAddWaypoint} waypoints={waypoints} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm">Waypoints ({waypoints.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {waypoints.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                None yet. Click anywhere on the map to drop a waypoint.
              </p>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {waypoints.map((wp, i) => (
                  <li
                    key={i}
                    className="border-border bg-card flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:gap-2 sm:py-1.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground min-w-0 truncate font-mono text-xs">
                        ({wp.x.toFixed(2)}, {wp.y.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex shrink-0 justify-end gap-1 sm:justify-start">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="sm:h-9 sm:w-9"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="sm:h-9 sm:w-9"
                        onClick={() => move(i, 1)}
                        disabled={i === waypoints.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive sm:h-9 sm:w-9"
                        onClick={() => remove(i)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <div className="border-border flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor="loop" className="flex cursor-pointer items-center gap-2">
                <Repeat className="h-4 w-4" /> Loop
              </Label>
              <Switch id="loop" className="shrink-0" checked={loop} onCheckedChange={setLoop} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleStart} disabled={busy} className="min-h-11 flex-1 gap-2">
                <Play className="h-4 w-4" /> Start
              </Button>
              <Button
                onClick={handleStop}
                disabled={busy}
                variant="outline"
                className="min-h-11 flex-1 gap-2"
              >
                <Square className="h-4 w-4" /> Stop
              </Button>
            </div>
            <Button
              variant="ghost"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setWaypoints([])}
              disabled={waypoints.length === 0}
            >
              Clear all waypoints
            </Button>

            {statusMsg && <p className="text-muted-foreground text-xs">{statusMsg}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
