"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pencil, RotateCcw } from "lucide-react";
import type { Layout, ResponsiveLayouts } from "react-grid-layout/legacy";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import {
  CockpitCameraStreamTile,
  CockpitDriveTile,
  CockpitMapTile,
  CockpitRobotModelTile,
} from "@/components/cockpit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COCKPIT_MY_UI_BREAKPOINTS_PX, COCKPIT_MY_UI_COLS } from "@/lib/cockpit-layout";
import type { CockpitMyUILayout } from "@/lib/types";
import {
  loadCockpitMyUILayout,
  resetCockpitMyUILayout,
  saveCockpitMyUILayout,
  subscribePreferences,
} from "@/lib/preferences";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DRAG_HANDLE = "my-ui-drag-handle cursor-grab select-none active:cursor-grabbing touch-none";

export default function MyUIPage() {
  const demoMode = useDemoModeFromUrl();
  const [layouts, setLayouts] = useState<CockpitMyUILayout["layouts"]>(
    () => loadCockpitMyUILayout().layouts,
  );
  const [editMode, setEditMode] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  /** Browser timers are numeric IDs (DOM lib); avoid NodeJS.Timeout mismatch. */
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return subscribePreferences(() => {
      setLayouts(loadCockpitMyUILayout().layouts);
    });
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }, []);

  const scheduleSave = useCallback(
    (next: CockpitMyUILayout["layouts"]) => {
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveCockpitMyUILayout(next);
        saveTimerRef.current = null;
        flashSaved();
      }, 450);
    },
    [flashSaved],
  );

  const onLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      const next = allLayouts as CockpitMyUILayout["layouts"];
      setLayouts(next);
      if (editMode) scheduleSave(next);
    },
    [editMode, scheduleSave],
  );

  const handleDoneEditing = () => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveCockpitMyUILayout(layouts);
    flashSaved();
    setEditMode(false);
  };

  const handleReset = () => {
    if (!window.confirm("Reset My UI layout to the default CockPit-style grid?")) return;
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const next = resetCockpitMyUILayout();
    setLayouts(next.layouts);
    setEditMode(false);
    flashSaved();
  };

  const dragCls = editMode ? DRAG_HANDLE : undefined;

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-display text-xl font-semibold md:text-2xl">My UI</h1>
            <Badge variant="outline" className="w-fit">
              Drag-drop
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Rearrange CockPit widgets; layout is saved in this browser (
            <Link
              className="text-primary hover:underline"
              href={withDemoHref("/profile", demoMode)}
            >
              profile
            </Link>
            ). Fixed layout:{" "}
            <Link
              className="text-primary hover:underline"
              href={withDemoHref("/cockpit", demoMode)}
            >
              /cockpit
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedFlash && (
            <span className="text-success text-xs" role="status">
              Saved
            </span>
          )}
          {editMode ? (
            <Button type="button" className="min-h-11 gap-2" onClick={handleDoneEditing}>
              <Check className="h-4 w-4" aria-hidden />
              Done editing
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 gap-2"
              onClick={() => setEditMode(true)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit layout
            </Button>
          )}
          <Button type="button" variant="outline" className="min-h-11 gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset layout
          </Button>
        </div>
      </div>

      <div className="border-border bg-card/30 min-w-0 rounded-xl border p-2 md:p-3">
        <ResponsiveGridLayout
          className="min-h-[480px]"
          breakpoints={COCKPIT_MY_UI_BREAKPOINTS_PX}
          cols={COCKPIT_MY_UI_COLS}
          layouts={layouts}
          rowHeight={32}
          margin={[10, 10]}
          containerPadding={[0, 0]}
          onLayoutChange={onLayoutChange}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle={editMode ? ".my-ui-drag-handle" : undefined}
          compactType="vertical"
          preventCollision={false}
        >
          <div key="robotModel" className="h-full min-h-0">
            <CockpitRobotModelTile
              cardClassName="h-full min-h-0 shadow-sm"
              dragHandleClassName={dragCls}
            />
          </div>
          <div key="cameraFront" className="h-full min-h-0">
            <CockpitCameraStreamTile
              name="front"
              label="front"
              title="Camera · front"
              cardClassName="h-full min-h-0 shadow-sm"
              dragHandleClassName={cn("block w-fit", dragCls)}
            />
          </div>
          <div key="cameraBack" className="h-full min-h-0">
            <CockpitCameraStreamTile
              name="back"
              label="back"
              title="Camera · back"
              cardClassName="h-full min-h-0 shadow-sm"
              dragHandleClassName={cn("block w-fit", dragCls)}
            />
          </div>
          <div key="drive" className="h-full min-h-0">
            <CockpitDriveTile
              cardClassName="h-full min-h-0 shadow-sm"
              dragHandleClassName={cn("block w-fit", dragCls)}
            />
          </div>
          <div key="map" className="h-full min-h-0">
            <CockpitMapTile
              cardClassName="h-full min-h-0 shadow-sm"
              dragHandleClassName={cn("block w-fit", dragCls)}
            />
          </div>
        </ResponsiveGridLayout>
      </div>

      {editMode && (
        <p className="text-muted-foreground text-xs">
          Drag tiles by their title bar. Resize from the corner handle. Joystick and video stay
          usable when you are not dragging.
        </p>
      )}
    </div>
  );
}
