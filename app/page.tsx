"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Clock, History, Layers, Plug, Settings, Star } from "lucide-react";
import { connect, getStatus } from "@/lib/ros";
import { setRosbridgeUrl, getRosbridgeUrl, setVideoBaseUrl, getVideoBaseUrl } from "@/lib/env";
import {
  appendActivity,
  getFavoriteRobot,
  loadPreferences,
  rememberRobot,
  setSelectedRobotId,
  subscribePreferences,
} from "@/lib/preferences";
import { connectFleetRobot } from "@/lib/robot-connect";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DEFAULT_ROS = "ws://localhost:9090";
const DEFAULT_VIDEO = "http://localhost:8080";

export default function HomePage() {
  const router = useRouter();
  const demoMode = useDemoModeFromUrl();
  const [rosUrl, setRosUrl] = useState(DEFAULT_ROS);
  const [videoUrl, setVideoUrl] = useState(DEFAULT_VIDEO);
  const [recent, setRecent] = useState<string[]>([]);
  const [activity, setActivity] = useState(() => loadPreferences().activity.slice(0, 12));
  const [favoriteName, setFavoriteName] = useState<string | null>(null);
  const [status, setStatus] = useState(getStatus().status);
  const [error, setError] = useState<string | undefined>(getStatus().error);

  const refreshPrefs = () => {
    const prefs = loadPreferences();
    setRosUrl(getRosbridgeUrl() || prefs.defaultRobotUrl || DEFAULT_ROS);
    setVideoUrl(getVideoBaseUrl() || prefs.defaultVideoUrl || DEFAULT_VIDEO);
    setRecent(prefs.recentRobots);
    setActivity(prefs.activity.slice(0, 12));
    const fav = getFavoriteRobot();
    setFavoriteName(fav?.name ?? null);
  };

  useEffect(() => {
    refreshPrefs();
    return subscribePreferences(refreshPrefs);
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setRosbridgeUrl(rosUrl);
    setVideoBaseUrl(videoUrl);
    rememberRobot(rosUrl);
    setSelectedRobotId(null);
    setStatus("connecting");
    setError(undefined);
    const ros = await connect(rosUrl, /* force */ true);
    if (!ros) {
      setStatus("error");
      setError("could not initialize rosbridge client");
      return;
    }
    // Wait briefly for the connection event before navigating.
    let attempts = 0;
    const wait = () =>
      new Promise<void>((resolve) => {
        const tick = () => {
          const s = getStatus();
          if (s.status === "connected" || attempts > 30) {
            setStatus(s.status);
            setError(s.error);
            resolve();
            return;
          }
          attempts += 1;
          setTimeout(tick, 100);
        };
        tick();
      });
    await wait();
    if (getStatus().status === "connected") {
      appendActivity("connect", `Connected (manual entry)`);
      router.push(withDemoHref("/cockpit", demoMode));
    }
  };

  const handleQuickFavorite = async () => {
    const fav = getFavoriteRobot();
    if (!fav) return;
    setRosUrl(fav.rosbridgeUrl);
    setVideoUrl(fav.videoBaseUrl);
    await connectFleetRobot(fav, true);
    setStatus("connecting");
    setError(undefined);
    let attempts = 0;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const s = getStatus();
        if (s.status === "connected" || s.status === "error" || attempts > 40) {
          setStatus(s.status);
          setError(s.error);
          resolve();
          return;
        }
        attempts += 1;
        setTimeout(tick, 100);
      };
      tick();
    });
    if (getStatus().status === "connected") {
      appendActivity("connect", `Quick connect: ${fav.name}`);
      router.push(withDemoHref("/cockpit", demoMode));
    }
  };

  return (
    <div className="relative min-w-0">
      {/* Landing-style hero (sharp corners). */}
      <section className="border-border relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto flex max-w-screen-xl flex-col items-center px-4 py-16 text-center md:py-24">
          <Badge variant="outline" className="mb-4">
            v0.1 · open source
          </Badge>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            One brain, any bot.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm text-balance md:text-base">
            Connect any robot running <code className="text-foreground">openbrain-ros</code> and
            drive, monitor, and command it from the browser.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-screen-xl gap-6 p-4 md:grid-cols-3 md:p-8">
        {favoriteName && (
          <Card className="border-primary/25 bg-primary/5 md:col-span-3">
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <Star className="fill-warning text-warning h-4 w-4" /> Favorite robot
                </CardTitle>
                <CardDescription>
                  <span className="text-foreground">{favoriteName}</span> — one tap to connect and
                  open CockPit.
                </CardDescription>
              </div>
              <Button
                type="button"
                className="w-full gap-2 sm:w-auto"
                onClick={() => void handleQuickFavorite()}
              >
                <Plug className="h-4 w-4" /> Connect {favoriteName}
              </Button>
            </CardHeader>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Connect to a robot</CardTitle>
            <CardDescription>
              Point the dashboard at a rosbridge WebSocket and the openbrain-ros video streamer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleConnect}>
              <div className="grid gap-2">
                <Label htmlFor="rosbridge">rosbridge URL</Label>
                <Input
                  id="rosbridge"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  value={rosUrl}
                  onChange={(e) => setRosUrl(e.target.value)}
                  placeholder="ws://192.168.1.50:9090"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="video">video streamer URL</Label>
                <Input
                  id="video"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="http://192.168.1.50:8080"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground text-xs sm:min-w-0">
                  Status: <span className="text-foreground">{status}</span>
                  {error && <span className="text-destructive sm:ml-2">· {error}</span>}
                </div>
                <Button type="submit" size="lg" className="w-full shrink-0 gap-2 sm:w-auto">
                  <Plug className="h-4 w-4" />
                  Connect
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Recent URLs
            </CardTitle>
            <CardDescription>Last 5 rosbridge URLs you used.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {recent.map((url) => (
                  <li key={url}>
                    <button
                      type="button"
                      onClick={() => setRosUrl(url)}
                      className="border-border bg-card hover:bg-secondary/60 active:bg-secondary min-h-11 w-full touch-manipulation rounded-md border px-3 py-2 text-left text-xs"
                    >
                      {url}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Recent activity
            </CardTitle>
            <CardDescription>Stored locally in this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No events yet — connect or use Fleet/Maps.
              </p>
            ) : (
              <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto text-xs">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="border-border bg-card flex justify-between gap-2 rounded-md border px-2 py-1.5"
                  >
                    <span className="text-muted-foreground">{a.message}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                      {new Date(a.at).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> Fleet & tools
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <Link href={withDemoHref("/fleet", demoMode)}>
                <Bot className="h-4 w-4" /> Manage fleet
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <Link href={withDemoHref("/maps", demoMode)}>
                <Layers className="h-4 w-4" /> Maps & SLAM DB
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
              <Link href={withDemoHref("/settings", demoMode)}>
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">What&apos;s inside</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "CockPit",
                desc: "Dual cameras, virtual joystick, gamepad, 3D model, live map.",
                href: "/cockpit",
              },
              {
                title: "Maps",
                desc: "Mapping sessions, localization databases, live viewer.",
                href: "/maps",
              },
              {
                title: "Missions",
                desc: "Click-to-add waypoints, autonomous patrols.",
                href: "/missions",
              },
              {
                title: "Health",
                desc: "Live CPU, GPU, RAM, thermal zones, power rails.",
                href: "/health",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={withDemoHref(card.href, demoMode)}
                className="group border-border bg-card hover:border-primary/40 hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
              >
                <p className="font-display text-sm font-semibold">{card.title}</p>
                <p className="text-muted-foreground mt-1 text-xs">{card.desc}</p>
                <p className="text-primary mt-3 inline-flex items-center gap-1 text-xs">
                  Open{" "}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
