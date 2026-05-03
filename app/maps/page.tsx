"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Gamepad2,
  Loader2,
  Map as MapIcon,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from "lucide-react";
import { CameraStream, JoystickPad, MapView, type MapWaypoint } from "@/components/widgets";
import { useConnection, useService } from "@/components/ros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_MAP_DATABASE_ROWS } from "@/lib/demo-map";
import { appendActivity } from "@/lib/preferences";
import type {
  DeleteDatabaseRequest,
  LoadDatabaseRequest,
  MappingServiceResponse,
  SetMappingRequest,
  TriggerResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface MapRow {
  id: string;
  name: string;
  path: string;
}

/** OpenBrain localization DB services (optional on stack). */
const SRV = {
  list: ["/list_db_files", "bot_localization_interfaces/srv/ListDbFiles"] as const,
  load: ["/load_database", "bot_localization_interfaces/srv/LoadDB"] as const,
  mapping: ["/set_mapping", "bot_localization_interfaces/srv/SetMapping"] as const,
  localization: ["/set_localization", "bot_localization_interfaces/srv/SetLocalization"] as const,
  save: ["/save_database", "bot_localization_interfaces/srv/SaveDatabase"] as const,
  delete: ["/delete_database", "bot_localization_interfaces/srv/DeleteDB"] as const,
  current: ["/get_current_database", "std_srvs/srv/Trigger"] as const,
};

export default function MapsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
          <p className="text-muted-foreground text-sm">Loading maps…</p>
        </div>
      }
    >
      <MapsPageInner />
    </Suspense>
  );
}

function MapsPageInner() {
  const searchParams = useSearchParams();
  const demoForced = searchParams.get("demo") === "1";

  const { status } = useConnection(true);

  const listMaps = useService<Record<string, never>, MappingServiceResponse>(
    SRV.list[0],
    SRV.list[1],
  );
  const loadDb = useService<LoadDatabaseRequest, MappingServiceResponse>(SRV.load[0], SRV.load[1]);
  const setMapping = useService<SetMappingRequest, MappingServiceResponse>(
    SRV.mapping[0],
    SRV.mapping[1],
  );
  const setLocalization = useService<Record<string, never>, MappingServiceResponse>(
    SRV.localization[0],
    SRV.localization[1],
  );
  const saveDb = useService<Record<string, never>, MappingServiceResponse>(
    SRV.save[0],
    SRV.save[1],
  );
  const deleteDb = useService<DeleteDatabaseRequest, MappingServiceResponse>(
    SRV.delete[0],
    SRV.delete[1],
  );
  const getCurrent = useService<Record<string, never>, TriggerResponse>(
    SRV.current[0],
    SRV.current[1],
  );

  const [maps, setMaps] = useState<MapRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [isMapping, setIsMapping] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [mappingBusy, setMappingBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [showJoystick, setShowJoystick] = useState(false);

  const [homeDraft, setHomeDraft] = useState<MapWaypoint | null>(null);

  const demoSidebarActive = demoForced || status !== "connected";
  const displayMaps = demoSidebarActive ? DEMO_MAP_DATABASE_ROWS : maps;

  useEffect(() => {
    if (!demoSidebarActive || displayMaps.length === 0) return;
    setSelectedId((cur) => {
      if (cur && displayMaps.some((r) => r.id === cur)) return cur;
      return displayMaps[0]!.id;
    });
  }, [demoSidebarActive, displayMaps]);

  const listCall = listMaps.call;
  const getCurrentCall = getCurrent.call;

  const refreshMaps = useCallback(async () => {
    if (status !== "connected") return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listCall({});
      if (!res) {
        setListError("no response");
        return;
      }
      if (!res.success) {
        setListError(res.message ?? "list_db_files failed");
        return;
      }
      const files = res.db_files ?? [];
      const rows: MapRow[] = files.map((path, i) => ({
        id: String(i),
        name: path.replace(/\.db$/i, "").split(/[/\\]/).pop() ?? path,
        path,
      }));
      setMaps(rows);

      const cur = await getCurrentCall({});
      const activePath = cur?.success && cur.message?.trim() ? cur.message.trim() : null;
      if (activePath) {
        const hit = rows.find(
          (r) => r.path === activePath || r.name === activePath || r.path.endsWith(activePath),
        );
        if (hit) setSelectedId(hit.id);
      }
    } catch {
      setListError("Could not reach mapping services");
    } finally {
      setLoadingList(false);
    }
  }, [status, listCall, getCurrentCall]);

  useEffect(() => {
    if (status === "connected") void refreshMaps();
  }, [status, refreshMaps]);

  const handleStartMapping = async () => {
    if (!showNameInput) {
      setShowNameInput(true);
      return;
    }
    const raw = newMapName.trim();
    if (!raw) return;
    const dbFileName = `${raw.replace(/\s+/g, "_")}.db`;
    setMappingBusy(true);
    try {
      const res = await setMapping.call({ database_path: dbFileName, clear_db: true });
      if (!res?.success) {
        setListError(res?.message ?? "set_mapping failed");
        return;
      }
      setIsMapping(true);
      setShowNameInput(false);
      setNewMapName("");
      appendActivity("maps", `Started mapping: ${dbFileName}`);
    } finally {
      setMappingBusy(false);
    }
  };

  const handleStopMapping = async () => {
    setMappingBusy(true);
    try {
      await saveDb.call({});
      await setLocalization.call({});
      setIsMapping(false);
      setNewMapName("");
      appendActivity("maps", "Stopped mapping & saved database");
      setTimeout(() => void refreshMaps(), 800);
    } catch {
      setListError("save/localization failed");
    } finally {
      setMappingBusy(false);
    }
  };

  const handleLoadMap = async (row: MapRow) => {
    setActionBusy(row.id);
    setListError(null);
    try {
      const res = await loadDb.call({ database_path: row.path, clear_db: false });
      if (!res?.success) {
        setListError(res?.message ?? "load_database failed");
        return;
      }
      await setLocalization.call({});
      setSelectedId(row.id);
      appendActivity("maps", `Loaded map ${row.name}`);
    } finally {
      setActionBusy(null);
    }
  };

  const activeMap = selectedId ? displayMaps.find((m) => m.id === selectedId) : undefined;

  const handleDelete = async (row: MapRow) => {
    if (!confirm(`Delete map "${row.name}"?`)) return;
    setActionBusy(row.id);
    try {
      const res = await deleteDb.call({ database_path: row.path });
      if (!res?.success) {
        setListError(res?.message ?? "delete_database failed");
        return;
      }
      if (selectedId === row.id) setSelectedId(null);
      appendActivity("maps", `Deleted map ${row.name}`);
      setTimeout(() => void refreshMaps(), 400);
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="relative grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="max-w-2xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-semibold md:text-2xl">Maps</h1>
            {demoSidebarActive && (
              <Badge variant="warning" className="gap-1">
                <FlaskConical className="h-3 w-3" aria-hidden />
                demo data
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            SLAM database management compatible with OpenBrain{" "}
            <code className="text-foreground break-words">bot_localization_interfaces</code>{" "}
            services. If your stack does not expose them, calls will fail gracefully.
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-11 w-full shrink-0 gap-2 sm:w-auto"
          disabled={status !== "connected" || loadingList}
          onClick={() => void refreshMaps()}
        >
          <RefreshCw className={cn("h-4 w-4", loadingList && "animate-spin")} /> Refresh list
        </Button>
      </div>

      {listError && (
        <div className="border-warning/40 bg-warning/10 text-foreground rounded-lg border px-3 py-2 text-xs">
          {listError}
        </div>
      )}

      {status !== "connected" && !demoForced && (
        <div className="border-warning/40 bg-warning/10 text-foreground flex flex-col gap-2 rounded-md border px-3 py-3 text-xs sm:flex-row sm:items-center">
          <p>
            Sample map databases and synthetic <code className="text-foreground">/map</code> until
            rosbridge connects. Use <code className="text-foreground">?demo=1</code> to keep demo
            after connecting; <code className="text-foreground">?live=1</code> on Maps skips demo
            occupancy until a real <code className="text-foreground">/map</code> arrives.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Left: camera + joystick */}
        <div
          className={cn(
            "relative grid gap-4 transition-all xl:col-span-3",
            leftCollapsed && "xl:col-span-0 xl:hidden",
          )}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm">Live camera</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 xl:flex"
                aria-label="Collapse panel"
                onClick={() => setLeftCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <CameraStream name="front" label="front" />
              <Button
                variant={showJoystick ? "default" : "outline"}
                className="min-h-11 w-full gap-2 sm:h-9"
                onClick={() => setShowJoystick((v) => !v)}
              >
                <Gamepad2 className="h-4 w-4" />
                {showJoystick ? "Hide joystick" : "Show joystick"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {leftCollapsed && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-28 left-2 z-10 hidden min-h-11 min-w-11 xl:flex"
            aria-label="Expand panel"
            onClick={() => setLeftCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Map viewer */}
        <Card className={cn("xl:col-span-6", leftCollapsed && "xl:col-span-9")}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
              <MapIcon className="text-primary h-4 w-4" /> Map
            </CardTitle>
            <CardDescription>
              Live <code className="text-foreground">/map</code> + robot pose. Click to draft a home
              waypoint (display only).
              {activeMap && (
                <span className="text-foreground mt-1 block">Active DB: {activeMap.name}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[min(52vh,520px)] min-h-[280px] p-2">
            <MapView
              waypoints={homeDraft ? [homeDraft] : []}
              onMapClick={(p) => {
                setHomeDraft(p);
                appendActivity("maps", `Marked draft point (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
              }}
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Mapping control</CardTitle>
            <CardDescription>List, load, and record localization databases.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status === "connected" ? "success" : "outline"}>
                rosbridge {status}
              </Badge>
              {isMapping && (
                <Badge variant="warning" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> mapping
                </Badge>
              )}
            </div>

            {showNameInput && !isMapping && (
              <div className="grid gap-2">
                <Label htmlFor="mapname">New map name</Label>
                <Input
                  id="mapname"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="warehouse_floor_1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMapName.trim()) void handleStartMapping();
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isMapping ? (
                <Button
                  variant="destructive"
                  className="min-h-11 w-full gap-2 sm:w-auto"
                  disabled={mappingBusy || demoSidebarActive}
                  onClick={() => void handleStopMapping()}
                >
                  <Square className="h-4 w-4" /> Stop & save mapping
                </Button>
              ) : (
                <Button
                  className="min-h-11 w-full gap-2 sm:w-auto"
                  disabled={mappingBusy || status !== "connected" || demoSidebarActive}
                  onClick={() => void handleStartMapping()}
                >
                  <Play className="h-4 w-4" />
                  {showNameInput && newMapName.trim() ? "Start mapping" : "New map…"}
                </Button>
              )}
              {showNameInput && !isMapping && (
                <Button
                  variant="ghost"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => {
                    setShowNameInput(false);
                    setNewMapName("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Saved maps</p>
              {!displayMaps.length && !loadingList && (
                <p className="text-muted-foreground text-xs">No databases reported.</p>
              )}
              <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                {displayMaps.map((row) => {
                  const busy = actionBusy === row.id;
                  const active = selectedId === row.id;
                  return (
                    <li
                      key={row.id}
                      className={cn(
                        "border-border bg-card flex flex-col gap-1 rounded-lg border px-2 py-2 text-xs",
                        active && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{row.name}</span>
                        {active && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            active
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground font-mono text-[10px] break-all">
                        {row.path}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="min-h-11 flex-1 sm:h-9"
                          disabled={
                            busy || status !== "connected" || isMapping || demoSidebarActive
                          }
                          onClick={() => void handleLoadMap(row)}
                        >
                          Load
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive min-h-11 min-w-11 sm:h-9 sm:w-9"
                          disabled={busy || isMapping || demoSidebarActive}
                          aria-label="Delete map"
                          onClick={() => void handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {showJoystick && (
        <div className="border-border bg-background/95 fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px)+0.75rem)] left-1/2 z-40 w-[min(100%-2rem,380px)] -translate-x-1/2 rounded-2xl border p-3 shadow-xl backdrop-blur md:bottom-6 md:p-4">
          <p className="text-muted-foreground mb-2 text-center text-xs">Teleop overlay</p>
          <JoystickPad />
        </div>
      )}
    </div>
  );
}
