"use client";

import {
  CockpitCameraStreamTile,
  CockpitDriveTile,
  CockpitMapTile,
  CockpitRobotModelTile,
} from "@/components/cockpit";

export default function CockpitPage() {
  return (
    <div className="grid gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="font-display text-xl font-semibold md:text-2xl">CockPit</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Direct teleop · /cmd_vel</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex min-h-[min(56vh,560px)] flex-col lg:col-span-12 lg:min-h-[min(62vh,640px)]">
          <CockpitRobotModelTile className="h-full min-h-0" cardClassName="h-full min-h-0" />
        </div>

        <div className="grid gap-4 lg:col-span-7">
          <CockpitCameraStreamTile name="front" label="front" title="Camera · front" />
          <CockpitCameraStreamTile name="back" label="back" title="Camera · back" />
        </div>

        <div className="lg:col-span-5">
          <CockpitDriveTile />
        </div>

        <div className="flex min-h-[260px] flex-col lg:col-span-12 lg:h-[420px]">
          <CockpitMapTile cardClassName="h-full min-h-[260px] lg:h-full lg:min-h-0" />
        </div>
      </div>
    </div>
  );
}
