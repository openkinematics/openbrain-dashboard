// Per-operator preferences. localStorage today; Supabase migration in Phase 2.

"use client";

import type {
  ActivityEntry,
  CockpitMyUILayout,
  DashboardSettings,
  FleetRobot,
  UrdfPreviewSource,
} from "./types";
import { COCKPIT_MY_UI_LAYOUT_VERSION } from "./types";
import { defaultCockpitMyUILayout, normalizeCockpitMyUILayout } from "./cockpit-layout";
import { isBrowser } from "./utils";

export type SpeedProfile = "beginner" | "normal" | "insane";
export type ThemePreference = "light" | "dark" | "system";

export interface Preferences {
  defaultRobotUrl: string;
  defaultVideoUrl: string;
  speedProfile: SpeedProfile;
  theme: ThemePreference;
  recentRobots: string[];
  /** Local-first fleet registry */
  robots: FleetRobot[];
  /** Last explicitly chosen robot id from Fleet/home */
  selectedRobotId: string | null;
  /** Recent operator actions */
  activity: ActivityEntry[];
  dashboard: DashboardSettings;
  /** My UI drag-drop cockpit grid (localStorage; Supabase in Phase 2). */
  cockpitMyUILayout: CockpitMyUILayout;
  /** Cockpit URDF preview mode (uploaded file content is not persisted). */
  urdfPreviewSource: UrdfPreviewSource;
}

const KEY = "openbrain.preferences";

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  invertJoystickLR: false,
  joystickVisualizationOnly: false,
  gamepadAngularAxisIndex: 0,
  gamepadLinearAxisIndex: 1,
  videoTransport: "auto",
  overlayColor: "white",
};

function parseUrdfPreviewSource(v: unknown): UrdfPreviewSource {
  if (v === "humanoid_g1" || v === "humanoid_h2" || v === "dog" || v === "ros" || v === "upload") {
    return v;
  }
  if (v === "humanoid_h1") return "humanoid_g1";
  if (v === "humanoid") return "humanoid_h2";
  return "humanoid_h2";
}

const DEFAULT_PREFS: Preferences = {
  defaultRobotUrl: "",
  defaultVideoUrl: "",
  speedProfile: "normal",
  theme: "system",
  recentRobots: [],
  robots: [],
  selectedRobotId: null,
  activity: [],
  dashboard: DEFAULT_DASHBOARD_SETTINGS,
  cockpitMyUILayout: defaultCockpitMyUILayout(),
  urdfPreviewSource: "humanoid_h2",
};

export function loadPreferences(): Preferences {
  if (!isBrowser()) return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const merged = {
      ...DEFAULT_PREFS,
      ...parsed,
      robots: Array.isArray(parsed.robots) ? parsed.robots : DEFAULT_PREFS.robots,
      activity: Array.isArray(parsed.activity) ? parsed.activity : DEFAULT_PREFS.activity,
      dashboard: {
        ...DEFAULT_DASHBOARD_SETTINGS,
        ...(parsed.dashboard ?? {}),
      },
      recentRobots: Array.isArray(parsed.recentRobots)
        ? parsed.recentRobots
        : DEFAULT_PREFS.recentRobots,
      urdfPreviewSource: parseUrdfPreviewSource(parsed.urdfPreviewSource),
      cockpitMyUILayout: normalizeCockpitMyUILayout(parsed.cockpitMyUILayout),
    };
    return merged;
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Patch shape: top-level keys are partial, plus `dashboard` accepts a partial
 * patch (existing values are preserved). `cockpitMyUILayout` is replaced
 * wholesale because layouts are saved atomically by react-grid-layout.
 */
export type PreferencesPatch = Partial<Omit<Preferences, "dashboard">> & {
  dashboard?: Partial<DashboardSettings>;
};

export function savePreferences(prefs: PreferencesPatch) {
  if (!isBrowser()) return;
  const prev = loadPreferences();
  const { dashboard: dashPatch, cockpitMyUILayout: layoutPatch, ...rest } = prefs;
  const merged: Preferences = { ...prev, ...rest };
  if (dashPatch) {
    merged.dashboard = { ...prev.dashboard, ...dashPatch };
  }
  if (layoutPatch) {
    merged.cockpitMyUILayout = normalizeCockpitMyUILayout(layoutPatch);
  }
  localStorage.setItem(KEY, JSON.stringify(merged));
}

export function rememberRobot(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  const prefs = loadPreferences();
  const recent = [trimmed, ...prefs.recentRobots.filter((u) => u !== trimmed)].slice(0, 5);
  savePreferences({ recentRobots: recent });
}

export function notifyPreferencesChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("openbrain-prefs-changed"));
}

export function loadDashboardSettings(): DashboardSettings {
  return loadPreferences().dashboard;
}

export function saveDashboardSettings(patch: Partial<DashboardSettings>) {
  savePreferences({ dashboard: { ...loadPreferences().dashboard, ...patch } });
  notifyPreferencesChanged();
}

export function loadCockpitMyUILayout(): CockpitMyUILayout {
  return loadPreferences().cockpitMyUILayout;
}

/** Persist full breakpoint layouts (autosave from My UI). */
export function saveCockpitMyUILayout(layouts: CockpitMyUILayout["layouts"]) {
  savePreferences({
    cockpitMyUILayout: {
      version: COCKPIT_MY_UI_LAYOUT_VERSION,
      layouts,
    },
  });
  notifyPreferencesChanged();
}

/** Restore factory grid and persist. */
export function resetCockpitMyUILayout(): CockpitMyUILayout {
  const next = defaultCockpitMyUILayout();
  savePreferences({ cockpitMyUILayout: next });
  notifyPreferencesChanged();
  return next;
}

/** Subscribe to preference updates from other tabs or Settings saves. */
export function subscribePreferences(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onCustom = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("openbrain-prefs-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("openbrain-prefs-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function newId(): string {
  if (isBrowser() && typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function appendActivity(kind: ActivityEntry["kind"], message: string) {
  const entry: ActivityEntry = {
    id: newId(),
    at: Date.now(),
    kind,
    message,
  };
  const prefs = loadPreferences();
  const activity = [entry, ...prefs.activity].slice(0, 40);
  savePreferences({ activity });
  notifyPreferencesChanged();
}

export function upsertFleetRobot(
  input: Omit<FleetRobot, "id" | "isFavorite"> & { id?: string; isFavorite?: boolean },
): FleetRobot {
  const prefs = loadPreferences();
  let robots = [...prefs.robots];
  const id = input.id ?? newId();
  const existingIdx = robots.findIndex((r) => r.id === id);

  let isFavorite: boolean;
  if (existingIdx >= 0) {
    isFavorite = input.isFavorite !== undefined ? input.isFavorite : robots[existingIdx].isFavorite;
  } else {
    isFavorite = input.isFavorite ?? robots.length === 0;
  }

  const next: FleetRobot = {
    id,
    name: input.name.trim(),
    rosbridgeUrl: input.rosbridgeUrl.trim(),
    videoBaseUrl: input.videoBaseUrl.trim(),
    isFavorite,
  };

  if (isFavorite) {
    robots = robots.map((r) => ({ ...r, isFavorite: r.id === id }));
  }

  if (existingIdx >= 0) {
    robots[existingIdx] = next;
  } else {
    robots.push(next);
  }

  if (robots.length > 0 && !robots.some((r) => r.isFavorite)) {
    robots = robots.map((r, i) => ({ ...r, isFavorite: i === 0 }));
  }

  savePreferences({ robots });
  notifyPreferencesChanged();
  return robots.find((r) => r.id === id)!;
}

export function deleteFleetRobot(id: string) {
  const prefs = loadPreferences();
  const robots = prefs.robots.filter((r) => r.id !== id);
  let selectedRobotId = prefs.selectedRobotId;
  if (selectedRobotId === id) selectedRobotId = null;
  savePreferences({ robots, selectedRobotId });
  notifyPreferencesChanged();
}

export function setFleetFavorite(id: string) {
  const prefs = loadPreferences();
  const robots = prefs.robots.map((r) => ({
    ...r,
    isFavorite: r.id === id,
  }));
  savePreferences({ robots });
  notifyPreferencesChanged();
}

export function setSelectedRobotId(id: string | null) {
  savePreferences({ selectedRobotId: id });
  notifyPreferencesChanged();
}

export function getFavoriteRobot(): FleetRobot | null {
  return loadPreferences().robots.find((r) => r.isFavorite) ?? null;
}

export function getRobotById(id: string): FleetRobot | undefined {
  return loadPreferences().robots.find((r) => r.id === id);
}
