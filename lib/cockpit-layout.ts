import type {
  CockpitMyUiBreakpoint,
  CockpitMyUiLayoutItem,
  CockpitMyUILayout,
  CockpitMyUiWidgetId,
} from "@/lib/types";
import { COCKPIT_MY_UI_LAYOUT_VERSION } from "@/lib/types";

export const COCKPIT_MY_UI_WIDGET_IDS: CockpitMyUiWidgetId[] = [
  "robotModel",
  "cameraFront",
  "cameraBack",
  "drive",
  "map",
];

export const COCKPIT_MY_UI_BREAKPOINTS_PX: Record<CockpitMyUiBreakpoint, number> = {
  lg: 1024,
  md: 768,
  sm: 480,
  xs: 0,
};

export const COCKPIT_MY_UI_COLS: Record<CockpitMyUiBreakpoint, number> = {
  lg: 12,
  md: 12,
  sm: 6,
  xs: 4,
};

/** Default layouts mirror the fixed `/cockpit` grid at each breakpoint. */
export const DEFAULT_COCKPIT_MY_UI_LAYOUTS: Record<CockpitMyUiBreakpoint, CockpitMyUiLayoutItem[]> =
  {
    lg: [
      { i: "robotModel", x: 0, y: 0, w: 12, h: 20, minW: 4, minH: 12 },
      { i: "cameraFront", x: 0, y: 20, w: 7, h: 8, minW: 2, minH: 4 },
      { i: "cameraBack", x: 0, y: 28, w: 7, h: 8, minW: 2, minH: 4 },
      { i: "drive", x: 7, y: 20, w: 5, h: 16, minW: 3, minH: 8 },
      { i: "map", x: 0, y: 36, w: 12, h: 14, minW: 4, minH: 6 },
    ],
    md: [
      { i: "robotModel", x: 0, y: 0, w: 12, h: 18, minW: 4, minH: 12 },
      { i: "cameraFront", x: 0, y: 18, w: 7, h: 8, minW: 2, minH: 4 },
      { i: "cameraBack", x: 0, y: 26, w: 7, h: 8, minW: 2, minH: 4 },
      { i: "drive", x: 7, y: 18, w: 5, h: 16, minW: 3, minH: 8 },
      { i: "map", x: 0, y: 34, w: 12, h: 14, minW: 4, minH: 6 },
    ],
    sm: [
      { i: "robotModel", x: 0, y: 0, w: 6, h: 16, minW: 4, minH: 10 },
      { i: "cameraFront", x: 0, y: 16, w: 6, h: 7, minW: 3, minH: 4 },
      { i: "cameraBack", x: 0, y: 23, w: 6, h: 7, minW: 3, minH: 4 },
      { i: "drive", x: 0, y: 30, w: 6, h: 12, minW: 3, minH: 8 },
      { i: "map", x: 0, y: 42, w: 6, h: 12, minW: 4, minH: 6 },
    ],
    xs: [
      { i: "robotModel", x: 0, y: 0, w: 4, h: 18, minW: 2, minH: 10 },
      { i: "cameraFront", x: 0, y: 18, w: 4, h: 8, minW: 2, minH: 4 },
      { i: "cameraBack", x: 0, y: 26, w: 4, h: 8, minW: 2, minH: 4 },
      { i: "drive", x: 0, y: 34, w: 4, h: 12, minW: 2, minH: 8 },
      { i: "map", x: 0, y: 46, w: 4, h: 12, minW: 2, minH: 6 },
    ],
  };

export function defaultCockpitMyUILayout(): CockpitMyUILayout {
  return {
    version: COCKPIT_MY_UI_LAYOUT_VERSION,
    layouts: JSON.parse(JSON.stringify(DEFAULT_COCKPIT_MY_UI_LAYOUTS)) as Record<
      CockpitMyUiBreakpoint,
      CockpitMyUiLayoutItem[]
    >,
  };
}

function isWidgetId(i: string): i is CockpitMyUiWidgetId {
  return (COCKPIT_MY_UI_WIDGET_IDS as string[]).includes(i);
}

function mergeBreakpoint(
  defaults: CockpitMyUiLayoutItem[],
  saved: CockpitMyUiLayoutItem[] | undefined,
  cols: number,
): CockpitMyUiLayoutItem[] {
  const savedById = new Map<string, CockpitMyUiLayoutItem>();
  for (const item of saved ?? []) {
    if (item && typeof item.i === "string" && isWidgetId(item.i)) {
      savedById.set(item.i, item);
    }
  }

  return defaults.map((def) => {
    const s = savedById.get(def.i as CockpitMyUiWidgetId);
    if (!s) return { ...def };

    const minW = def.minW ?? 1;
    const minH = def.minH ?? 1;
    const maxW = Math.min(def.maxW ?? cols, cols);
    const w = Math.min(Math.max(s.w, minW), maxW);
    const h = Math.max(s.h, minH);
    const x = Math.max(0, Math.min(s.x, Math.max(0, cols - w)));
    const y = Math.max(0, s.y);

    return {
      ...def,
      x,
      y,
      w,
      h,
    };
  });
}

/** Normalize persisted layout: version gate + per-breakpoint merge with defaults. */
export function normalizeCockpitMyUILayout(raw: unknown): CockpitMyUILayout {
  const fallback = defaultCockpitMyUILayout();

  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Partial<CockpitMyUILayout>;
  if (obj.version !== COCKPIT_MY_UI_LAYOUT_VERSION) return fallback;

  const layouts = obj.layouts;
  if (!layouts || typeof layouts !== "object") return fallback;

  const next: Record<CockpitMyUiBreakpoint, CockpitMyUiLayoutItem[]> = {
    lg: mergeBreakpoint(
      DEFAULT_COCKPIT_MY_UI_LAYOUTS.lg,
      layouts.lg as CockpitMyUiLayoutItem[] | undefined,
      COCKPIT_MY_UI_COLS.lg,
    ),
    md: mergeBreakpoint(
      DEFAULT_COCKPIT_MY_UI_LAYOUTS.md,
      layouts.md as CockpitMyUiLayoutItem[] | undefined,
      COCKPIT_MY_UI_COLS.md,
    ),
    sm: mergeBreakpoint(
      DEFAULT_COCKPIT_MY_UI_LAYOUTS.sm,
      layouts.sm as CockpitMyUiLayoutItem[] | undefined,
      COCKPIT_MY_UI_COLS.sm,
    ),
    xs: mergeBreakpoint(
      DEFAULT_COCKPIT_MY_UI_LAYOUTS.xs,
      layouts.xs as CockpitMyUiLayoutItem[] | undefined,
      COCKPIT_MY_UI_COLS.xs,
    ),
  };

  return { version: COCKPIT_MY_UI_LAYOUT_VERSION, layouts: next };
}
