"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { useConnection, useTopic } from "@/components/ros";
import { DEMO_OCCUPANCY_GRID, makeDemoOdometry } from "@/lib/demo-map";
import type { OccupancyGridMsg, OdometryMsg, PoseStampedMsg } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MapWaypoint {
  x: number;
  y: number;
}

interface MapViewProps {
  className?: string;
  /** Show robot pose marker from /odom. */
  showPose?: boolean;
  /** Click-to-add waypoint mode. Returns map-frame coordinates. */
  onMapClick?: (point: MapWaypoint) => void;
  /** Existing waypoints to draw. */
  waypoints?: MapWaypoint[];
  /** Publish a goal pose on click instead of bubbling up. Mutually exclusive with onMapClick. */
  publishGoal?: boolean;
}

const DARK_FREE = "#0a0a0a";
const LIGHT_FREE = "#f5f5f5";
const ROBOT = "oklch(0.65 0.2 250)";

function quaternionToYaw(q: { x: number; y: number; z: number; w: number }) {
  return Math.atan2(2.0 * (q.w * q.z + q.x * q.y), 1.0 - 2.0 * (q.y * q.y + q.z * q.z));
}

function MapCanvasSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 text-muted-foreground flex h-full min-h-[200px] w-full items-center justify-center rounded-xl border text-xs",
        className,
      )}
    >
      Loading map…
    </div>
  );
}

function MapViewInner({
  className,
  showPose = true,
  onMapClick,
  waypoints,
  publishGoal = false,
}: MapViewProps) {
  const searchParams = useSearchParams();
  const demoForced = searchParams.get("demo") === "1";
  /** Wait for real /map only (no synthetic occupancy until it arrives). */
  const liveForced = searchParams.get("live") === "1";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 400 });
  const [demoActive, setDemoActive] = useState(() => {
    if (demoForced) return true;
    if (liveForced) return false;
    return true;
  });
  const [demoTick, setDemoTick] = useState(0);

  const { status: rosStatus } = useConnection(false);

  const { message: liveMap } = useTopic<OccupancyGridMsg>("/map", "nav_msgs/OccupancyGrid", {
    throttleRate: 1000,
  });
  const { message: liveOdom } = useTopic<OdometryMsg>(
    showPose ? "/odom" : null,
    "nav_msgs/Odometry",
    { throttleRate: 100 },
  );
  const { publish: publishGoalMsg } = useTopic<PoseStampedMsg>(
    publishGoal ? "/goal_pose" : null,
    "geometry_msgs/PoseStamped",
    { publishOnly: true },
  );

  useEffect(() => {
    if (liveMap && !demoForced) setDemoActive(false);
  }, [liveMap, demoForced]);

  /** Optional: wait for real /map only (`?live=1`), including client navigations to that URL. */
  useEffect(() => {
    if (demoForced) return;
    if (liveForced) setDemoActive(false);
  }, [liveForced, demoForced]);

  useEffect(() => {
    if (!liveForced || demoForced) return;
    if (liveMap) setDemoActive(false);
  }, [liveForced, demoForced, liveMap]);

  useEffect(() => {
    if (!demoForced && !demoActive) return;
    const id = setInterval(() => setDemoTick((n) => n + 1), 400);
    return () => clearInterval(id);
  }, [demoForced, demoActive]);

  const map = useMemo<OccupancyGridMsg | null>(() => {
    if (demoForced || demoActive) return DEMO_OCCUPANCY_GRID;
    return liveMap;
  }, [demoForced, demoActive, liveMap]);

  const odom = useMemo<OdometryMsg | null>(() => {
    if (!showPose) return null;
    if (demoForced || demoActive) return makeDemoOdometry(demoTick);
    return liveOdom;
  }, [showPose, demoForced, demoActive, demoTick, liveOdom]);

  /** Nav shows "demo" when offline; on-map chip only if rosbridge is up but /map not yet. */
  const showOnMapDemoBadge = (demoForced || demoActive) && rosStatus === "connected";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.max(200, width), h: Math.max(150, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? DARK_FREE : LIGHT_FREE;
    ctx.fillRect(0, 0, size.w, size.h);

    if (!map) {
      ctx.fillStyle = isDark ? "#666" : "#999";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("waiting for /map…", size.w / 2, size.h / 2);
      return;
    }

    const { width: mw, height: mh, resolution, origin } = map.info;
    const data = map.data;

    const scale = Math.min(size.w / mw, size.h / mh);
    const offsetX = (size.w - mw * scale) / 2;
    const offsetY = (size.h - mh * scale) / 2;

    const img = ctx.createImageData(mw, mh);
    for (let i = 0; i < data.length; i += 1) {
      const v = data[i];
      let r = 0;
      let g = 0;
      let b = 0;
      if (v < 0) {
        r = g = b = isDark ? 0x3b : 0xc0;
      } else if (v >= 50) {
        r = g = b = isDark ? 0xee : 0x22;
      } else {
        r = g = b = isDark ? 0x0a : 0xf5;
      }
      const row = mh - 1 - Math.floor(i / mw);
      const col = i % mw;
      const idx = (row * mw + col) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
    const off = document.createElement("canvas");
    off.width = mw;
    off.height = mh;
    off.getContext("2d")?.putImageData(img, 0, 0);
    // Smooth scaled occupancy layers — avoids harsh chunky stair-steps when cells span multiple px.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, offsetX, offsetY, mw * scale, mh * scale);

    const worldToPx = (wx: number, wy: number) => {
      const mxCells = (wx - origin.position.x) / resolution;
      const myCells = (wy - origin.position.y) / resolution;
      const px = offsetX + mxCells * scale;
      const py = offsetY + (mh - myCells) * scale;
      return { px, py };
    };

    if (waypoints?.length) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = ROBOT;
      ctx.lineWidth = 2;
      waypoints.forEach((wp, i) => {
        const { px, py } = worldToPx(wp.x, wp.y);
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isDark ? "#000" : "#fff";
        ctx.font = "bold 11px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), px, py);
        ctx.fillStyle = "#ffffff";
      });
    }

    if (showPose && odom) {
      const { px, py } = worldToPx(odom.pose.pose.position.x, odom.pose.pose.position.y);
      const yaw = quaternionToYaw(odom.pose.pose.orientation);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-yaw);
      ctx.fillStyle = ROBOT;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-7, 6);
      ctx.lineTo(-7, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [map, odom, size, showPose, waypoints]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!map || (!onMapClick && !publishGoal)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { width: mw, height: mh, resolution, origin } = map.info;
      const scale = Math.min(size.w / mw, size.h / mh);
      const offsetX = (size.w - mw * scale) / 2;
      const offsetY = (size.h - mh * scale) / 2;
      const mxCells = (x - offsetX) / scale;
      const myCells = mh - (y - offsetY) / scale;
      const wx = mxCells * resolution + origin.position.x;
      const wy = myCells * resolution + origin.position.y;

      if (publishGoal) {
        const now = Date.now();
        const sec = Math.floor(now / 1000);
        const nanosec = (now % 1000) * 1_000_000;
        void publishGoalMsg({
          header: { stamp: { sec, nanosec }, frame_id: "map" },
          pose: {
            position: { x: wx, y: wy, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
          },
        });
      } else {
        onMapClick?.({ x: wx, y: wy });
      }
    },
    [map, size, onMapClick, publishGoal, publishGoalMsg],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "border-border bg-card relative h-full w-full overflow-hidden rounded-xl border",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={cn("h-full w-full", (onMapClick || publishGoal) && "cursor-crosshair")}
      />
      {showOnMapDemoBadge && (
        <Badge
          variant="warning"
          className="pointer-events-none absolute top-2 right-2 gap-1 text-[10px]"
        >
          <FlaskConical className="h-3 w-3" aria-hidden />
          demo map
        </Badge>
      )}
    </div>
  );
}

export function MapView(props: MapViewProps) {
  return (
    <Suspense fallback={<MapCanvasSkeleton className={props.className} />}>
      <MapViewInner {...props} />
    </Suspense>
  );
}
