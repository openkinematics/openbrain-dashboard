"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Topic as RosTopic } from "roslib";
import { ensureRos, onStatusChange } from "@/lib/ros";

interface TopicOptions {
  /** Skip subscribing — useful for publish-only topics. */
  publishOnly?: boolean;
  /** Throttle in ms passed to rosbridge (server-side). 0 = no throttle. */
  throttleRate?: number;
  /** Queue length on the rosbridge side. Default 1 = latest-only. */
  queueLength?: number;
}

/**
 * Subscribe to a ROS topic and (optionally) publish to it.
 *
 * Returns the latest message and a publish function. The publish function is
 * stable across renders.
 */
export function useTopic<TMsg>(
  name: string | null | undefined,
  messageType: string,
  options: TopicOptions = {},
) {
  const { publishOnly = false, throttleRate = 0, queueLength = 1 } = options;
  const [message, setMessage] = useState<TMsg | null>(null);
  const topicRef = useRef<RosTopic<TMsg> | null>(null);

  // Recreate the Topic whenever the name/type changes — not when callbacks do.
  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    let topic: RosTopic<TMsg> | null = null;

    const setup = async () => {
      const ros = await ensureRos();
      if (!ros || cancelled) return;
      const { Topic } = await import("roslib");
      topic = new Topic<TMsg>({
        ros,
        name,
        messageType,
        throttle_rate: throttleRate,
        queue_length: queueLength,
      });
      topicRef.current = topic;

      if (!publishOnly) {
        topic.subscribe((msg: unknown) => {
          if (!cancelled) setMessage(msg as TMsg);
        });
      }
    };

    void setup();

    // Re-bind when the connection drops and recovers, otherwise the Topic is
    // attached to a dead Ros and silently never receives messages.
    const unsub = onStatusChange((status) => {
      if (status === "connected" && !topic) void setup();
    });

    return () => {
      cancelled = true;
      unsub();
      if (topic) {
        try {
          topic.unsubscribe();
        } catch {
          /* ignore */
        }
      }
      topicRef.current = null;
    };
  }, [name, messageType, publishOnly, throttleRate, queueLength]);

  const publish = useCallback(async (payload: unknown) => {
    const topic = topicRef.current;
    if (!topic) return false;
    topic.publish(payload as TMsg);
    return true;
  }, []);

  return { message, publish } as const;
}
