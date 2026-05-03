"use client";

import { useEffect, useState } from "react";
import { connect, getStatus, onStatusChange, type RosStatus } from "@/lib/ros";

export interface ConnectionState {
  status: RosStatus;
  url: string | null;
  error?: string;
}

/**
 * Subscribes to the rosbridge connection lifecycle. Triggers a connection
 * attempt on mount unless one is already in flight.
 */
export function useConnection(autoConnect = true): ConnectionState {
  const [state, setState] = useState<ConnectionState>(() => getStatus());

  useEffect(() => {
    const unsub = onStatusChange((status, error) => {
      setState((prev) => ({ ...prev, status, error }));
    });
    setState(getStatus());
    if (autoConnect) {
      void connect();
    }
    return unsub;
  }, [autoConnect]);

  return state;
}
