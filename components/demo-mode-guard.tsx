"use client";

import { useEffect } from "react";
import { useDemoModeFromUrl } from "@/lib/demo-routing";
import { setDemoMode } from "@/lib/ros";

/**
 * Mounted high in the tree so the rosbridge singleton learns about `?demo=1`
 * before any topic/service hook tries to open a socket. With this in place,
 * demo routes don't generate background reconnection noise.
 */
export function DemoModeGuard() {
  const demo = useDemoModeFromUrl();
  useEffect(() => {
    setDemoMode(demo);
  }, [demo]);
  return null;
}
