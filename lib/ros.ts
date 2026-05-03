// rosbridge client singleton.
//
// roslibjs is browser-only — it pulls in `ws` for the Node entry point. We
// guard every browser API behind `isBrowser()` and only `import("roslib")` on
// the client so SSR doesn't crash.
//
// One Ros instance per URL: switching robots tears down the old socket cleanly.

"use client";

import type { Ros } from "roslib";
import { getRosbridgeUrl } from "./env";
import { isBrowser } from "./utils";

export type RosStatus = "idle" | "connecting" | "connected" | "closed" | "error";

type Listener = (status: RosStatus, detail?: string) => void;

let RosCtor: (typeof import("roslib"))["Ros"] | null = null;
let currentUrl: string | null = null;
let currentRos: Ros | null = null;
let currentStatus: RosStatus = "idle";
let lastError: string | undefined;
const listeners = new Set<Listener>();

// Reconnect: exponential backoff capped at 10s. Cleared on a clean connection
// or on an explicit disconnect/repoint.
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;

// When true, every connect/reconnect attempt is short-circuited. Set by the
// `<DemoModeGuard>` when the URL carries `?demo=1` so the synthetic data path
// is the only thing running — no console noise from a backend that isn't there.
let demoMode = false;

async function loadRosConstructor(): Promise<(typeof import("roslib"))["Ros"]> {
  if (!RosCtor) {
    const { Ros } = await import("roslib");
    RosCtor = Ros;
  }
  return RosCtor;
}

function setStatus(next: RosStatus, detail?: string) {
  currentStatus = next;
  lastError = detail;
  for (const listener of listeners) listener(next, detail);
}

function scheduleReconnect(url: string) {
  if (demoMode || reconnectTimer) return;
  const delay = Math.min(10_000, 500 * 2 ** reconnectAttempt);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connect(url, /* force */ true);
  }, delay);
}

function clearReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempt = 0;
}

/**
 * Toggle global demo mode. When on, no rosbridge socket is opened and
 * any in-flight retry timer is cleared. The current Ros instance (if any)
 * is closed so subscribers see "idle".
 */
export function setDemoMode(next: boolean) {
  if (demoMode === next) return;
  demoMode = next;
  if (next) {
    clearReconnect();
    if (currentRos) {
      try {
        currentRos.close();
      } catch {
        /* ignore */
      }
    }
    currentRos = null;
    currentUrl = null;
    setStatus("idle");
  }
}

export function isDemoMode(): boolean {
  return demoMode;
}

/**
 * Connect (or reconnect) to a rosbridge URL. Idempotent: passing the same URL
 * while already connected/connecting is a no-op unless `force` is true.
 *
 * Returns null in demo mode — callers should handle that as "not connected".
 */
export async function connect(url?: string, force = false): Promise<Ros | null> {
  if (!isBrowser()) return null;
  if (demoMode) return null;
  const target = (url ?? getRosbridgeUrl()).trim();
  if (!target) return null;

  if (!force && currentRos && currentUrl === target && currentStatus === "connected") {
    return currentRos;
  }

  if (currentRos && currentUrl !== target) {
    // Switching URLs — close the old socket so we don't leak listeners.
    try {
      currentRos.close();
    } catch {
      /* ignore */
    }
    currentRos = null;
  }

  const Ros = await loadRosConstructor();
  setStatus("connecting");
  currentUrl = target;

  const ros = new Ros({ url: target });
  currentRos = ros;

  ros.on("connection", () => {
    clearReconnect();
    setStatus("connected");
  });
  ros.on("error", (err: unknown) => {
    const message = err instanceof Error ? err.message : "rosbridge connection error";
    setStatus("error", message);
  });
  ros.on("close", () => {
    setStatus("closed");
    if (currentUrl) scheduleReconnect(currentUrl);
  });

  return ros;
}

/** Returns the current Ros instance synchronously, or null if not connected. */
export function getRos(): Ros | null {
  return currentRos;
}

/** Get-or-connect: useful for hooks that want a Ros handle eagerly. */
export async function ensureRos(): Promise<Ros | null> {
  if (demoMode) return null;
  if (currentRos && currentStatus === "connected") return currentRos;
  return connect();
}

export function getStatus(): { status: RosStatus; url: string | null; error?: string } {
  return { status: currentStatus, url: currentUrl, error: lastError };
}

export function onStatusChange(listener: Listener): () => void {
  listeners.add(listener);
  // Fire immediately so subscribers don't miss the current state.
  listener(currentStatus, lastError);
  return () => {
    listeners.delete(listener);
  };
}

export function disconnect() {
  clearReconnect();
  if (currentRos) {
    try {
      currentRos.close();
    } catch {
      /* ignore */
    }
  }
  currentRos = null;
  currentUrl = null;
  setStatus("idle");
}

/**
 * Resolve once the connection settles (`connected` or `error`) or the timeout
 * elapses. Replaces the ad-hoc 100 ms polling loops in `/`, `/fleet`, etc.
 */
export function waitForConnection(timeoutMs = 4000): Promise<RosStatus> {
  return new Promise((resolve) => {
    if (currentStatus === "connected" || currentStatus === "error") {
      resolve(currentStatus);
      return;
    }
    const start = Date.now();
    const tick = () => {
      if (currentStatus === "connected" || currentStatus === "error") {
        resolve(currentStatus);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(currentStatus);
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}
