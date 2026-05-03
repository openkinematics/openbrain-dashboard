"use client";

import { useEffect, useState } from "react";
import { loadDashboardSettings, subscribePreferences } from "@/lib/preferences";
import type { DashboardSettings } from "@/lib/types";

/** Live dashboard teleop/stream settings (updates when Settings saves or other tabs change storage). */
export function useDashboardSettings(): DashboardSettings {
  const [settings, setSettings] = useState<DashboardSettings>(() => loadDashboardSettings());

  useEffect(() => {
    setSettings(loadDashboardSettings());
    return subscribePreferences(() => setSettings(loadDashboardSettings()));
  }, []);

  return settings;
}
