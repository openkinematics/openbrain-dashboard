"use client";

import { useCallback, useState } from "react";
import { ensureRos } from "@/lib/ros";

export interface ServiceCallState<TRes> {
  loading: boolean;
  error?: string;
  data?: TRes;
}

/**
 * Wrap a ROS service call. Returns a `call(req)` function plus the latest
 * result/loading/error state.
 */
export function useService<TReq, TRes>(name: string, serviceType: string) {
  const [state, setState] = useState<ServiceCallState<TRes>>({ loading: false });

  const call = useCallback(
    async (request: TReq): Promise<TRes | null> => {
      setState({ loading: true });
      try {
        const ros = await ensureRos();
        if (!ros) throw new Error("not connected to rosbridge");
        const { Service } = await import("roslib");
        const service = new Service({ ros, name, serviceType });
        return await new Promise<TRes>((resolve, reject) => {
          service.callService(
            request as TReq & Record<string, unknown>,
            (res: unknown) => {
              setState({ loading: false, data: res as TRes });
              resolve(res as TRes);
            },
            (err: unknown) => {
              const message = typeof err === "string" ? err : "service call failed";
              setState({ loading: false, error: message });
              reject(new Error(message));
            },
          );
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "service call failed";
        setState({ loading: false, error: message });
        return null;
      }
    },
    [name, serviceType],
  );

  return { ...state, call } as const;
}
