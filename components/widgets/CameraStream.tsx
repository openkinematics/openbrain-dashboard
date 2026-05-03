"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, VideoOff } from "lucide-react";
import { DEFAULT_CAMERA_NO_SIGNAL_POSTER_URL } from "@/lib/env";
import { subscribeStream, type StreamMode } from "@/lib/webrtc";
import { useDashboardSettings } from "@/lib/use-dashboard-settings";
import type { CameraOverlayColor } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const OVERLAY_BADGE: Record<CameraOverlayColor, string> = {
  white: "border-white/35 text-white",
  black: "border-neutral-950/80 text-white",
  red: "border-red-500/80 text-white",
  purple: "border-purple-500/80 text-white",
  blue: "border-primary/80 text-white",
  green: "border-green-500/80 text-white",
};

interface CameraStreamProps {
  /** Stream name (e.g. `front`, `back`). */
  name: string;
  /** Display label shown in the corner. */
  label?: string;
  /** Aspect ratio (`16/9` default). */
  aspect?: string;
  className?: string;
  /** Override dashboard stream transport for this tile. */
  transport?: "auto" | "webrtc" | "mjpeg";
  /** Override dashboard overlay accent. */
  overlayColor?: CameraOverlayColor;
  /** Backdrop while loading / on error (defaults to env poster). */
  noSignalPosterUrl?: string;
}

export function CameraStream({
  name,
  label,
  aspect = "16 / 9",
  className,
  transport: transportProp,
  overlayColor: overlayProp,
  noSignalPosterUrl = DEFAULT_CAMERA_NO_SIGNAL_POSTER_URL,
}: CameraStreamProps) {
  const dash = useDashboardSettings();
  const transport = transportProp ?? dash.videoTransport;
  const overlayColor = overlayProp ?? dash.overlayColor;
  const accent = OVERLAY_BADGE[overlayColor];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<StreamMode | "loading">("loading");
  const [error, setError] = useState<string | undefined>();
  const [videoDecodeError, setVideoDecodeError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let handle: { close: () => void } | null = null;
    let cancelled = false;
    setVideoDecodeError(false);

    void subscribeStream(video, name, undefined, { transport }).then((h) => {
      if (cancelled) {
        h.close();
        return;
      }
      handle = h;
      setMode(h.mode);
      setError(h.error);
    });

    const onVideoError = () => {
      if (cancelled) return;
      setVideoDecodeError(true);
    };
    video.addEventListener("error", onVideoError);

    return () => {
      cancelled = true;
      video.removeEventListener("error", onVideoError);
      handle?.close();
    };
  }, [name, transport]);

  const showPoster =
    Boolean(noSignalPosterUrl) && (mode === "loading" || mode === "error" || videoDecodeError);
  const showNoSignalUi = mode === "error" || videoDecodeError;

  return (
    <div
      className={cn("border-border relative overflow-hidden rounded-xl border bg-black", className)}
      style={{ aspectRatio: aspect }}
    >
      {showPoster && (
        // Dynamic operator-provided poster URL; keep native img to avoid build-time remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={noSignalPosterUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn("relative z-[1] h-full w-full object-cover", showPoster && "opacity-0")}
      />

      {mode === "loading" && !videoDecodeError && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/35 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {showNoSignalUi && (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-black/50 px-4 text-center text-white">
          <VideoOff className="h-6 w-6 shrink-0" aria-hidden />
          <p className="text-sm font-medium tracking-wide">Camera · no signal</p>
          {(error ?? (videoDecodeError ? "Stream failed to load" : undefined)) && (
            <p className="max-w-[90%] text-xs opacity-80">{error ?? "Stream failed to load"}</p>
          )}
        </div>
      )}

      <div className="absolute top-2 left-2 flex gap-2">
        {label && (
          <Badge variant="outline" className={cn("bg-black/60", accent)}>
            {label}
          </Badge>
        )}
        {mode !== "loading" && mode !== "error" && (
          <Badge
            variant={mode === "webrtc" ? "success" : "warning"}
            className={cn("bg-black/60", accent)}
          >
            {mode}
          </Badge>
        )}
      </div>
    </div>
  );
}
