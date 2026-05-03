// Public environment helpers. NEXT_PUBLIC_* values are inlined at build time.
//
// Reading them through these helpers (instead of `process.env.X` at the call
// site) gives one place to fall back to localStorage overrides — so an
// operator can repoint to a different robot without rebuilding the app.

import { isBrowser } from "./utils";

const KEYS = {
  rosbridge: "openbrain.rosbridgeUrl",
  video: "openbrain.videoBaseUrl",
} as const;

export const DEFAULT_ROSBRIDGE_URL =
  process.env.NEXT_PUBLIC_ROSBRIDGE_URL?.trim() || "ws://localhost:9090";

export const DEFAULT_VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_BASE_URL?.trim() || "http://localhost:8080";

/** Shown behind camera tiles while connecting or when the stream is unavailable (override for custom artwork). */
export const DEFAULT_CAMERA_NO_SIGNAL_POSTER_URL =
  process.env.NEXT_PUBLIC_CAMERA_NO_SIGNAL_POSTER_URL?.trim() || "/camera-no-signal.svg";

export const MARKETING_URL = "https://www.openkinematics.com";

export const DASHBOARD_REPO_URL = "https://github.com/openkinematics/openbrain-dashboard";

export function getRosbridgeUrl(): string {
  if (!isBrowser()) return DEFAULT_ROSBRIDGE_URL;
  return localStorage.getItem(KEYS.rosbridge)?.trim() || DEFAULT_ROSBRIDGE_URL;
}

export function setRosbridgeUrl(url: string) {
  if (!isBrowser()) return;
  if (url.trim()) localStorage.setItem(KEYS.rosbridge, url.trim());
  else localStorage.removeItem(KEYS.rosbridge);
}

export function getVideoBaseUrl(): string {
  if (!isBrowser()) return DEFAULT_VIDEO_BASE_URL;
  return localStorage.getItem(KEYS.video)?.trim() || DEFAULT_VIDEO_BASE_URL;
}

export function setVideoBaseUrl(url: string) {
  if (!isBrowser()) return;
  if (url.trim()) localStorage.setItem(KEYS.video, url.trim());
  else localStorage.removeItem(KEYS.video);
}
