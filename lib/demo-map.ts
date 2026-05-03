// Synthetic /map + /odom for reviewers and offline UI.
// Activated from MapView by default until a live /map arrives (`?demo=1` keeps demo after connect;
// `?live=1` waits for real /map only).

import type { OccupancyGridMsg, OdometryMsg } from "./types";

/** Larger grid + finer cells so the canvas scales without giant chunky pixels. */
const MW = 260;
const MH = 200;
const RES = 0.035;

/** Map origin (bottom-left of grid in map frame). */
const ORIGIN_X = -4.55;
const ORIGIN_Y = -3.5;

function buildDemoOccupancyGrid(): OccupancyGridMsg {
  const data = new Array<number>(MW * MH).fill(-1);

  const cx = (MW - 1) / 2;
  const cy = (MH - 1) / 2;
  const rx = MW / 2 - 22;
  const ry = MH / 2 - 18;

  const normR = (x: number, y: number) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return Math.hypot(dx, dy);
  };

  for (let y = 0; y < MH; y += 1) {
    for (let x = 0; x < MW; x += 1) {
      const i = y * MW + x;
      const r = normR(x, y);
      if (r > 1.12) data[i] = -1;
      else if (r > 0.94) data[i] = 100;
      else data[i] = 0;
    }
  }

  const stampObs = (x0: number, y0: number, x1: number, y1: number) => {
    const xa = Math.max(0, Math.min(MW - 1, Math.min(x0, x1)));
    const xb = Math.max(0, Math.min(MW - 1, Math.max(x0, x1)));
    const ya = Math.max(0, Math.min(MH - 1, Math.min(y0, y1)));
    const yb = Math.max(0, Math.min(MH - 1, Math.max(y0, y1)));
    for (let y = ya; y <= yb; y += 1) {
      for (let x = xa; x <= xb; x += 1) {
        const i = y * MW + x;
        if (data[i] !== -1) data[i] = 100;
      }
    }
  };

  // Vertical spine with a generous doorway belt around mid-height.
  stampObs(Math.round(cx - 5), 28, Math.round(cx + 5), Math.round(cy - 26));
  stampObs(Math.round(cx - 5), Math.round(cy + 26), Math.round(cx + 5), MH - 30);

  // North bay shelving blocks (wide aisles between).
  stampObs(36, 36, 78, 54);
  stampObs(92, 36, 134, 54);
  stampObs(148, 36, MW - 42, 54);

  // South alcoves.
  stampObs(40, MH - 64, 96, MH - 36);
  stampObs(MW - 112, MH - 64, MW - 46, MH - 36);

  const stamp = { sec: 0, nanosec: 0 };
  return {
    header: { stamp, frame_id: "map" },
    info: {
      resolution: RES,
      width: MW,
      height: MH,
      origin: {
        position: { x: ORIGIN_X, y: ORIGIN_Y, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    data,
  };
}

export const DEMO_OCCUPANCY_GRID: OccupancyGridMsg = buildDemoOccupancyGrid();

/** Fake localization DB rows for the Maps sidebar (offline / ?demo=1). */
export const DEMO_MAP_DATABASE_ROWS: { id: string; name: string; path: string }[] = [
  { id: "demo-a", name: "warehouse_floor_a", path: "/data/maps/warehouse_floor_a.db" },
  { id: "demo-b", name: "office_nav2_slam", path: "/data/maps/office_nav2_slam.db" },
  { id: "demo-c", name: "loading_dock_v3", path: "/data/maps/loading_dock_v3.db" },
];

/** Patrol near geometric center of the demo grid (map frame). */
export function makeDemoOdometry(tick: number): OdometryMsg {
  const cx = ORIGIN_X + (MW * RES) / 2;
  const cy = ORIGIN_Y + (MH * RES) / 2;

  const t = tick * 0.022;
  const x = cx + Math.sin(t * 1.05) * 1.25;
  const y = cy + Math.cos(t * 0.88) * 0.85;
  const yaw = t * 0.28;
  const half = yaw / 2;
  const stamp = { sec: Math.floor(tick / 20), nanosec: (tick % 20) * 50_000_000 };
  return {
    header: { stamp, frame_id: "odom" },
    child_frame_id: "base_link",
    pose: {
      pose: {
        position: { x, y, z: 0 },
        orientation: { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) },
      },
    },
    twist: {
      twist: {
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 },
      },
    },
  };
}
