// Helpers for subscribing to the openbrain-ros WebRTC video streamer.
//
// The streamer exposes:
//   POST  /stream/<name>/offer  { sdp, type } -> { sdp, type }
//   GET   /stream/<name>.mjpeg                -> MJPEG fallback
//
// We try WebRTC first; if it fails (HTTPS-only contexts, no STUN, browser
// doesn't allow insecure peer connections, etc.) we fall back to MJPEG.

"use client";

import { getIceServers, getVideoBaseUrl } from "./env";

export type StreamMode = "webrtc" | "mjpeg" | "error";

export interface StreamHandle {
  /** Stop the stream and release resources. Safe to call multiple times. */
  close: () => void;
  /** Which transport ended up being used. */
  mode: StreamMode;
  /** Last error message, if any. */
  error?: string;
}

/**
 * Attach a remote video track from openbrain-ros to a `<video>` element.
 * Tries WebRTC; on failure, swaps the element's `src` to the MJPEG endpoint.
 */
export interface SubscribeStreamOptions {
  /** Video transport preference from dashboard settings. */
  transport?: "auto" | "webrtc" | "mjpeg";
}

export async function subscribeStream(
  videoEl: HTMLVideoElement,
  streamName: string,
  baseUrl?: string,
  options?: SubscribeStreamOptions,
): Promise<StreamHandle> {
  const root = (baseUrl ?? getVideoBaseUrl()).replace(/\/+$/, "");
  const offerUrl = `${root}/stream/${encodeURIComponent(streamName)}/offer`;
  const mjpegUrl = `${root}/stream/${encodeURIComponent(streamName)}.mjpeg`;

  let pc: RTCPeerConnection | null = null;

  const fallbackToMjpeg = (err?: unknown): StreamHandle => {
    if (pc) {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
      pc = null;
    }
    videoEl.srcObject = null;
    videoEl.src = mjpegUrl;
    void videoEl.play().catch(() => {
      /* autoplay may be blocked — user gesture will retry */
    });
    return {
      mode: "mjpeg",
      error: err instanceof Error ? err.message : undefined,
      close() {
        videoEl.removeAttribute("src");
        videoEl.load();
      },
    };
  };

  if (options?.transport === "mjpeg") {
    return fallbackToMjpeg();
  }

  try {
    pc = new RTCPeerConnection({ iceServers: getIceServers() });
    pc.addTransceiver("video", { direction: "recvonly" });

    const remoteStream = new MediaStream();
    videoEl.srcObject = remoteStream;

    pc.ontrack = (event) => {
      for (const track of event.streams[0]?.getTracks() ?? [event.track]) {
        remoteStream.addTrack(track);
      }
    };

    const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering to finish so we send a complete SDP in one shot.
    await new Promise<void>((resolve) => {
      if (!pc) return resolve();
      if (pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (pc?.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
      // Hard timeout — don't hang forever on a misconfigured TURN.
      setTimeout(resolve, 1500);
    });

    const localDesc = pc.localDescription;
    if (!localDesc) throw new Error("no local SDP");

    const res = await fetch(offerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sdp: localDesc.sdp, type: localDesc.type }),
    });
    if (!res.ok) throw new Error(`offer rejected: ${res.status}`);
    const answer = (await res.json()) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(answer);

    void videoEl.play().catch(() => {});

    const handle: StreamHandle = {
      mode: "webrtc",
      close() {
        if (pc) {
          try {
            pc.close();
          } catch {
            /* ignore */
          }
          pc = null;
        }
        videoEl.srcObject = null;
      },
    };
    return handle;
  } catch (err) {
    if (options?.transport === "webrtc") {
      videoEl.srcObject = null;
      const message = err instanceof Error ? err.message : "WebRTC failed";
      return {
        mode: "error",
        error: message,
        close() {
          videoEl.removeAttribute("src");
          videoEl.load();
        },
      };
    }
    return fallbackToMjpeg(err);
  }
}
