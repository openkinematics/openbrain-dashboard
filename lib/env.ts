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

/**
 * Public origin of the deployed dashboard. Used by `app/sitemap.ts`,
 * `app/robots.ts`, and OG metadata. Override in production.
 */
export const DEPLOYMENT_URL =
  process.env.NEXT_PUBLIC_DEPLOYMENT_URL?.trim() || "https://dashboard.openkinematics.com";

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

/**
 * Build the WebRTC ICE server list from env. STUN defaults to a Google public
 * server; TURN must be configured by the operator — without it, peers behind
 * symmetric NAT silently fall back to MJPEG.
 *
 *   NEXT_PUBLIC_STUN_URLS=stun:foo:3478,stun:bar:3478
 *   NEXT_PUBLIC_TURN_URLS=turn:turn.example.com:3478?transport=udp
 *   NEXT_PUBLIC_TURN_USERNAME=user
 *   NEXT_PUBLIC_TURN_CREDENTIAL=pass
 */
export function getIceServers(): RTCIceServer[] {
  const stunUrls = (process.env.NEXT_PUBLIC_STUN_URLS ?? "stun:stun.l.google.com:19302")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const turnUrls = (process.env.NEXT_PUBLIC_TURN_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const servers: RTCIceServer[] = [];
  if (stunUrls.length) servers.push({ urls: stunUrls });
  if (turnUrls.length) {
    servers.push({
      urls: turnUrls,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }
  return servers;
}
