"use client";

import { Loader2, Plug, PlugZap, AlertTriangle, FlaskConical } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@/components/ros";
import { Badge } from "@/components/ui/badge";

export function ConnectionStatus() {
  const searchParams = useSearchParams();
  const demoForced = searchParams.get("demo") === "1";
  const { status, url, error } = useConnection(false);

  if (demoForced) {
    return (
      <Badge variant="warning" className="min-h-11 touch-manipulation gap-1.5 px-2 py-1">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden /> demo
      </Badge>
    );
  }

  if (status === "connected") {
    return (
      <Badge variant="success" className="min-h-11 touch-manipulation gap-1.5 px-2 py-1">
        <PlugZap className="h-3.5 w-3.5 shrink-0" /> connected
        {url && <span className="hidden max-w-[200px] truncate opacity-70 lg:inline">· {url}</span>}
      </Badge>
    );
  }
  if (status === "connecting") {
    return (
      <Badge variant="outline" className="min-h-11 touch-manipulation gap-1.5 px-2 py-1">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> connecting…
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge
        variant="destructive"
        className="min-h-11 touch-manipulation gap-1.5 px-2 py-1"
        title={error}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> error
      </Badge>
    );
  }
  if (status === "closed") {
    return (
      <Badge variant="warning" className="min-h-11 touch-manipulation gap-1.5 px-2 py-1">
        <Plug className="h-3.5 w-3.5 shrink-0" /> reconnecting…
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="min-h-11 touch-manipulation gap-1.5 px-2 py-1">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden /> demo
    </Badge>
  );
}
