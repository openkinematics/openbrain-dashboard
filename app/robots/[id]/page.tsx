"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plug, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRobotById, subscribePreferences } from "@/lib/preferences";
import { connectFleetRobot, logFleetConnectSuccess } from "@/lib/robot-connect";
import { getStatus } from "@/lib/ros";
import type { FleetRobot } from "@/lib/types";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";

export default function RobotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const demoMode = useDemoModeFromUrl();
  const id = typeof params?.id === "string" ? params.id : "";
  const [robot, setRobot] = useState<FleetRobot | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!id) return;
    setRobot(getRobotById(id) ?? null);
  }, [id]);

  useEffect(() => {
    refresh();
    return subscribePreferences(refresh);
  }, [refresh]);

  const handleConnect = async () => {
    if (!robot) return;
    setBusy(true);
    try {
      await connectFleetRobot(robot, true);
      let n = 0;
      await new Promise<void>((resolve) => {
        const tick = () => {
          if (getStatus().status === "connected" || getStatus().status === "error" || n > 40) {
            resolve();
            return;
          }
          n += 1;
          setTimeout(tick, 100);
        };
        tick();
      });
      if (getStatus().status === "connected") {
        logFleetConnectSuccess(robot);
        router.push(withDemoHref("/cockpit", demoMode));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return (
      <div className="min-w-0 p-4 md:p-6">
        <p className="text-muted-foreground text-sm">Invalid robot id.</p>
        <Button variant="link" className="min-h-11" asChild>
          <Link href={withDemoHref("/fleet", demoMode)}>Fleet</Link>
        </Button>
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
        <Button variant="ghost" size="sm" className="min-h-11 w-fit gap-1" asChild>
          <Link href={withDemoHref("/fleet", demoMode)}>
            <ArrowLeft className="h-4 w-4" /> Fleet
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Robot not found</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            This id is not in your local fleet registry.{" "}
            <Link className="text-primary hover:underline" href={withDemoHref("/fleet", demoMode)}>
              Add it in Fleet
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="min-h-11 w-full gap-1 sm:w-auto" asChild>
          <Link href={withDemoHref("/fleet", demoMode)}>
            <ArrowLeft className="h-4 w-4" /> Fleet
          </Link>
        </Button>
        <Button
          className="min-h-11 w-full gap-2 sm:w-auto"
          disabled={busy}
          onClick={() => void handleConnect()}
        >
          <Plug className="h-4 w-4" /> Connect & open CockPit
        </Button>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-display text-xl font-semibold md:text-2xl">{robot.name}</h1>
        {robot.isFavorite && (
          <Badge variant="outline" className="gap-1">
            <Star className="fill-warning text-warning h-3 w-3" /> favorite
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Rosbridge</p>
            <p className="font-mono text-xs break-all">{robot.rosbridgeUrl}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Video</p>
            <p className="font-mono text-xs break-all">{robot.videoBaseUrl}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" asChild>
            <Link href={withDemoHref("/cockpit", demoMode)}>CockPit</Link>
          </Button>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" asChild>
            <Link href={withDemoHref("/maps", demoMode)}>Maps</Link>
          </Button>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" asChild>
            <Link href={withDemoHref("/health", demoMode)}>Health</Link>
          </Button>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" asChild>
            <Link href={withDemoHref("/missions", demoMode)}>Missions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
