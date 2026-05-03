"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Save } from "lucide-react";
import { loadPreferences, savePreferences, type SpeedProfile } from "@/lib/preferences";
import { setRosbridgeUrl, setVideoBaseUrl } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [defaultRobotUrl, setDefaultRobotUrl] = useState("");
  const [defaultVideoUrl, setDefaultVideoUrl] = useState("");
  const [speedProfile, setSpeedProfile] = useState<SpeedProfile>("normal");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefs = loadPreferences();
    setDefaultRobotUrl(prefs.defaultRobotUrl);
    setDefaultVideoUrl(prefs.defaultVideoUrl);
    setSpeedProfile(prefs.speedProfile);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences({ defaultRobotUrl, defaultVideoUrl, speedProfile });
    if (defaultRobotUrl) setRosbridgeUrl(defaultRobotUrl);
    if (defaultVideoUrl) setVideoBaseUrl(defaultVideoUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-4 p-3 md:gap-6 md:p-6">
      <h1 className="font-display text-xl font-semibold md:text-2xl">Profile</h1>

      <form onSubmit={handleSave} className="grid min-w-0 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Defaults</CardTitle>
            <CardDescription>Used the next time you open the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="robot">Default rosbridge URL</Label>
              <Input
                id="robot"
                value={defaultRobotUrl}
                onChange={(e) => setDefaultRobotUrl(e.target.value)}
                placeholder="ws://localhost:9090"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="video">Default video streamer URL</Label>
              <Input
                id="video"
                value={defaultVideoUrl}
                onChange={(e) => setDefaultVideoUrl(e.target.value)}
                placeholder="http://localhost:8080"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="speed">Default speed profile</Label>
              <Select
                value={speedProfile}
                onValueChange={(v) => setSpeedProfile(v as SpeedProfile)}
              >
                <SelectTrigger id="speed">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner — 0.2 m/s</SelectItem>
                  <SelectItem value="normal">Normal — 0.6 m/s</SelectItem>
                  <SelectItem value="insane">Insane — 1.5 m/s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appearance</CardTitle>
            <CardDescription>Theme follows your OS by default.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme ?? "system"} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-xs">
              Per-operator preferences sync to localStorage today; Supabase migration is in Phase 2.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center">
          <Button type="submit" className="w-full gap-2 md:w-auto">
            <Save className="h-4 w-4" /> Save
          </Button>
          {saved && <span className="text-success text-xs">saved</span>}
        </div>
      </form>
    </div>
  );
}
