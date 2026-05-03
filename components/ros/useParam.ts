"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureRos } from "@/lib/ros";

/**
 * Read/write a ROS parameter. Reads once on mount; `set` writes back to the
 * parameter server.
 */
export function useParam<T = unknown>(name: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    const fetchParam = async () => {
      try {
        const ros = await ensureRos();
        if (!ros || cancelled) return;
        const { Param } = await import("roslib");
        const param = new Param({ ros, name });
        param.get((v: unknown) => {
          if (cancelled) return;
          setValue(v as T);
          setLoading(false);
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "param read failed");
        setLoading(false);
      }
    };
    void fetchParam();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const set = useCallback(
    async (next: T) => {
      const ros = await ensureRos();
      if (!ros) throw new Error("not connected");
      const { Param } = await import("roslib");
      const param = new Param({ ros, name });
      await new Promise<void>((resolve) => {
        param.set(next, () => resolve());
      });
      setValue(next);
    },
    [name],
  );

  return { value, loading, error, set } as const;
}
