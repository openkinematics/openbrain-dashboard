"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import {
  appendActivity,
  DEFAULT_DASHBOARD_SETTINGS,
  loadDashboardSettings,
  saveDashboardSettings,
  subscribePreferences,
} from "@/lib/preferences";
import type { CameraOverlayColor, DashboardSettings, VideoTransportPreference } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";

const OVERLAY_OPTIONS: { value: CameraOverlayColor; label: string }[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
];

const TRANSPORT_OPTIONS: { value: VideoTransportPreference; label: string }[] = [
  { value: "auto", label: "Auto — WebRTC then MJPEG fallback" },
  { value: "webrtc", label: "WebRTC only" },
  { value: "mjpeg", label: "MJPEG only" },
];

const AXIS_OPTS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
  value: String(i),
  label: `Axis ${i}`,
}));

export default function SettingsPage() {
  const demoMode = useDemoModeFromUrl();
  const [dash, setDash] = useState<DashboardSettings>(() => loadDashboardSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setDash(loadDashboardSettings());
    sync();
    return subscribePreferences(sync);
  }, []);

  const patch = (p: Partial<DashboardSettings>) => setDash((d) => ({ ...d, ...p }));

  const handleSave = () => {
    saveDashboardSettings(dash);
    appendActivity("settings", "Saved dashboard settings");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold md:text-2xl">Settings</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Teleop, gamepad axes, and camera transport — stored in this browser only.
          </p>
        </div>
        <Button type="button" className="w-full shrink-0 gap-2 sm:w-auto" onClick={handleSave}>
          <Save className="h-4 w-4" /> Save
          {saved && <span className="sr-only">saved</span>}
        </Button>
      </div>
      {saved && <p className="text-success text-xs">Saved.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Joystick & gamepad</CardTitle>
            <CardDescription>
              Virtual stick follows OpenBrain operator controls. Standard layout: axis 0 = yaw
              input, axis 1 = forward input.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Label htmlFor="inv">Invert left / right (touch stick)</Label>
                <p className="text-muted-foreground text-xs">
                  Flips angular output from the pad UI.
                </p>
              </div>
              <Switch
                id="inv"
                className="shrink-0"
                checked={dash.invertJoystickLR}
                onCheckedChange={(v) => patch({ invertJoystickLR: v })}
              />
            </div>
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Label htmlFor="viz">Joystick visualization only</Label>
                <p className="text-muted-foreground text-xs">
                  UI moves but /cmd_vel publishes zeros — safe for demos.
                </p>
              </div>
              <Switch
                id="viz"
                className="shrink-0"
                checked={dash.joystickVisualizationOnly}
                onCheckedChange={(v) => patch({ joystickVisualizationOnly: v })}
              />
            </div>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="axis-ang">Gamepad angular axis</Label>
                <Select
                  value={String(dash.gamepadAngularAxisIndex)}
                  onValueChange={(v) => patch({ gamepadAngularAxisIndex: Number(v) })}
                >
                  <SelectTrigger id="axis-ang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AXIS_OPTS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="axis-lin">Gamepad linear axis</Label>
                <Select
                  value={String(dash.gamepadLinearAxisIndex)}
                  onValueChange={(v) => patch({ gamepadLinearAxisIndex: Number(v) })}
                >
                  <SelectTrigger id="axis-lin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AXIS_OPTS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Video streams</CardTitle>
            <CardDescription>
              Matches openbrain-ros streamer: WebRTC offer endpoint or MJPEG fallback.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="transport">Transport</Label>
              <Select
                value={dash.videoTransport}
                onValueChange={(v) => patch({ videoTransport: v as VideoTransportPreference })}
              >
                <SelectTrigger id="transport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="overlay">Camera overlay accent</Label>
              <Select
                value={dash.overlayColor}
                onValueChange={(v) => patch({ overlayColor: v as CameraOverlayColor })}
              >
                <SelectTrigger id="overlay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERLAY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              type="button"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setDash({ ...DEFAULT_DASHBOARD_SETTINGS })}
            >
              Reset to defaults
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        Theme and default URLs stay on{" "}
        <Link className="text-primary hover:underline" href={withDemoHref("/profile", demoMode)}>
          Profile
        </Link>
        .
      </p>
    </div>
  );
}
