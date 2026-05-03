"use client";

import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import {
  CameraStream,
  JoystickPad,
  MapView,
  RobotModel3D,
  SpeedProfileSelector,
} from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { loadPreferences } from "@/lib/preferences";
import type { SpeedProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CockpitTileDragProps {
  /** When set, this strip is the drag handle (match `draggableHandle` on the grid). */
  dragHandleClassName?: string;
}

export function CockpitRobotModelTile({
  className,
  cardClassName,
  dragHandleClassName,
}: CockpitTileDragProps & { className?: string; cardClassName?: string }) {
  const [robotModalOpen, setRobotModalOpen] = useState(false);

  return (
    <>
      <Card
        className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", cardClassName, className)}
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className={cn("min-w-0 flex-1", dragHandleClassName)}>
              <CardTitle className="text-base md:text-lg">Robot model</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 shrink-0 gap-2"
              onClick={() => setRobotModalOpen(true)}
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
              Expand view
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0 lg:min-h-[320px]">
          <RobotModel3D className="min-h-0 flex-1 px-4 pt-0 pb-4" />
        </CardContent>
      </Card>

      <Dialog open={robotModalOpen} onOpenChange={setRobotModalOpen}>
        <DialogContent className="border-border bg-card top-4 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[min(1400px,calc(100vw-1rem))] max-w-none translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:top-6 sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(1400px,calc(100vw-2rem))]">
          <div className="border-border flex shrink-0 flex-col gap-1 border-b px-4 py-3 pr-12">
            <DialogTitle className="text-left text-base leading-tight font-semibold">
              Robot model · expanded
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-left text-xs">
              Same URDF source as the card below · drag to orbit · Esc or close to exit
            </DialogDescription>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {robotModalOpen ? <RobotModel3D className="h-full min-h-0" showSourcePicker /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CockpitCameraStreamTile({
  name,
  label,
  title,
  cardClassName,
  dragHandleClassName,
}: CockpitTileDragProps & {
  name: string;
  label?: string;
  title: string;
  cardClassName?: string;
}) {
  return (
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", cardClassName)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm", dragHandleClassName)}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-2 pt-0">
        <CameraStream name={name} label={label ?? name} />
      </CardContent>
    </Card>
  );
}

export function CockpitDriveTile({
  cardClassName,
  dragHandleClassName,
}: CockpitTileDragProps & { cardClassName?: string }) {
  const [initialProfile, setInitialProfile] = useState<SpeedProfile>("normal");

  useEffect(() => {
    setInitialProfile(loadPreferences().speedProfile);
  }, []);

  return (
    <Card className={cn("flex min-h-0 flex-col", cardClassName)}>
      <CardHeader>
        <CardTitle className={cn("text-sm", dragHandleClassName)}>Drive</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center gap-4">
        <JoystickPad />
        <SpeedProfileSelector initial={initialProfile} />
      </CardContent>
    </Card>
  );
}

export function CockpitMapTile({
  cardClassName,
  dragHandleClassName,
}: CockpitTileDragProps & { cardClassName?: string }) {
  return (
    <Card className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", cardClassName)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm", dragHandleClassName)}>
          Map · click to send /goal_pose
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[200px] flex-1 p-2 lg:h-[calc(100%-3.5rem)] lg:min-h-0">
        <MapView publishGoal className="h-full min-h-0 w-full" />
      </CardContent>
    </Card>
  );
}
