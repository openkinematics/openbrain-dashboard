"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Link2,
  Pencil,
  Plug,
  PlugZap,
  RefreshCw,
  Star,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useConnection } from "@/components/ros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStatus, waitForConnection } from "@/lib/ros";
import {
  deleteFleetRobot,
  loadPreferences,
  setFleetFavorite,
  upsertFleetRobot,
  subscribePreferences,
} from "@/lib/preferences";
import {
  applyRobotEndpoints,
  connectFleetRobot,
  logFleetConnectSuccess,
  logFleetAction,
} from "@/lib/robot-connect";
import type { FleetRobot } from "@/lib/types";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";
import { cn } from "@/lib/utils";

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="fleet-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative z-10 flex max-h-[min(90dvh,36rem)] w-full max-w-md flex-col overflow-hidden shadow-xl">
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle id="fleet-modal-title" className="text-base">
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" className="min-h-11 shrink-0" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto overscroll-contain">{children}</CardContent>
      </Card>
    </div>
  );
}

export default function FleetPage() {
  const router = useRouter();
  const demoMode = useDemoModeFromUrl();
  const { status, url } = useConnection(false);
  const [robots, setRobots] = useState<FleetRobot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FleetRobot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FleetRobot | null>(null);

  const [name, setName] = useState("");
  const [rosbridge, setRosbridge] = useState("ws://192.168.1.50:9090");
  const [video, setVideo] = useState("http://192.168.1.50:8080");
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    const prefs = loadPreferences();
    setRobots(prefs.robots);
    setSelectedId(prefs.selectedRobotId);
  };

  useEffect(() => {
    refresh();
    return subscribePreferences(refresh);
  }, []);

  const selectedRobot = useMemo(
    () => robots.find((r) => r.id === selectedId) ?? null,
    [robots, selectedId],
  );

  const openAdd = () => {
    setEditing(null);
    setName("");
    setRosbridge("ws://192.168.1.50:9090");
    setVideo("http://192.168.1.50:8080");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (robot: FleetRobot) => {
    setEditing(robot);
    setName(robot.name);
    setRosbridge(robot.rosbridgeUrl);
    setVideo(robot.videoBaseUrl);
    setFormError("");
    setModalOpen(true);
  };

  const handleSaveRobot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!rosbridge.trim()) {
      setFormError("Rosbridge URL is required");
      return;
    }
    if (!video.trim()) {
      setFormError("Video URL is required");
      return;
    }
    upsertFleetRobot({
      id: editing?.id,
      name: name.trim(),
      rosbridgeUrl: rosbridge.trim(),
      videoBaseUrl: video.trim(),
      isFavorite: editing?.isFavorite,
    });
    logFleetAction(editing ? `Updated robot "${name.trim()}"` : `Added robot "${name.trim()}"`);
    setModalOpen(false);
    refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const removedId = deleteTarget.id;
    const removedName = deleteTarget.name;
    deleteFleetRobot(removedId);
    logFleetAction(`Removed robot "${removedName}"`);
    setDeleteTarget(null);
    refresh();
    if (selectedId === removedId) {
      setSelectedId(null);
    }
  };

  const handleConnect = async (robot: FleetRobot) => {
    setBusyId(robot.id);
    try {
      await connectFleetRobot(robot, true);
      await waitForConnection(4000);
      if (getStatus().status === "connected") {
        logFleetConnectSuccess(robot);
        refresh();
        router.push(withDemoHref("/cockpit", demoMode));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleApplyEndpoints = (robot: FleetRobot) => {
    applyRobotEndpoints(robot);
    logFleetAction(`Applied endpoints for ${robot.name}`);
    refresh();
  };

  const handleFavorite = (robot: FleetRobot) => {
    setFleetFavorite(robot.id);
    logFleetAction(`Favorite: ${robot.name}`);
    refresh();
  };

  const connectedToSelected =
    status === "connected" && selectedRobot && url === selectedRobot.rosbridgeUrl;

  return (
    <div className="grid min-w-0 gap-4 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold md:text-2xl">Fleet</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Local-first robot list · endpoints sync to rosbridge + video streamer
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="min-h-11 w-full gap-2 sm:w-auto"
            onClick={() => refresh()}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="min-h-11 w-full gap-2 sm:w-auto" onClick={openAdd}>
            <Bot className="h-4 w-4" /> Add robot
          </Button>
        </div>
      </div>

      {selectedRobot && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
              <Link2 className="text-primary h-4 w-4" /> Active selection
            </CardTitle>
            <CardDescription>
              {connectedToSelected ? (
                <span className="text-success">Connected to {selectedRobot.name}</span>
              ) : (
                <span>
                  Selected: <strong>{selectedRobot.name}</strong> — apply or connect to use it
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="secondary" className="min-h-11 w-full gap-2 sm:w-auto" asChild>
              <Link href={withDemoHref("/cockpit", demoMode)}>Open CockPit</Link>
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full gap-2 sm:w-auto"
              onClick={() => void handleConnect(selectedRobot)}
              disabled={busyId !== null}
            >
              <Plug className="h-4 w-4" /> Connect now
            </Button>
          </CardContent>
        </Card>
      )}

      {robots.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No robots yet</CardTitle>
            <CardDescription>
              Add your first robot with rosbridge WebSocket and WebRTC/MJPEG base URLs. Data stays
              in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="min-h-11 w-full sm:w-auto" onClick={openAdd}>
              Add robot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {robots.map((robot) => {
            const isSel = selectedId === robot.id;
            const isBusy = busyId === robot.id;
            const live = status === "connected" && url?.trim() === robot.rosbridgeUrl.trim();

            return (
              <li key={robot.id}>
                <Card className={cn(isSel && "ring-primary/40 ring-1")}>
                  <CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="bg-secondary font-display text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                        {robot.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                          {robot.name}
                          {robot.isFavorite && (
                            <Star
                              className="fill-warning text-warning h-4 w-4"
                              aria-label="Favorite"
                            />
                          )}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1 font-mono text-[11px] break-all">
                          {robot.rosbridgeUrl}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={live ? "success" : "outline"}
                      className="w-fit shrink-0 gap-1 sm:self-start"
                    >
                      {live ? (
                        <>
                          <PlugZap className="h-3 w-3" /> live
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" /> idle
                        </>
                      )}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-muted-foreground font-mono text-[11px] break-all">
                      video {robot.videoBaseUrl}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <Button
                        className="min-h-11 gap-2 sm:w-auto"
                        disabled={isBusy}
                        onClick={() => void handleConnect(robot)}
                      >
                        {isBusy ? (
                          <>
                            <Wifi className="h-4 w-4 animate-pulse" /> …
                          </>
                        ) : (
                          <>
                            <Plug className="h-4 w-4" /> Connect
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="min-h-11 gap-2 sm:w-auto" asChild>
                        <Link
                          href={withDemoHref(`/robots/${encodeURIComponent(robot.id)}`, demoMode)}
                        >
                          Detail
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        className="min-h-11 gap-2 sm:w-auto"
                        onClick={() => handleApplyEndpoints(robot)}
                      >
                        Apply URLs
                      </Button>
                      {!robot.isFavorite && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="col-span-2 min-h-11 w-full sm:col-span-1 sm:h-11 sm:w-11"
                          aria-label="Set favorite"
                          onClick={() => handleFavorite(robot)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="min-h-11 w-full sm:h-11 sm:w-11"
                        aria-label="Edit"
                        onClick={() => openEdit(robot)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive min-h-11 w-full sm:h-11 sm:w-11"
                        aria-label="Delete"
                        onClick={() => setDeleteTarget(robot)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Edit robot" : "Add robot"}
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={handleSaveRobot}>
          <div className="grid gap-2">
            <Label htmlFor="fname">Display name</Label>
            <Input
              id="fname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kitchen bot"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fros">Rosbridge WebSocket</Label>
            <Input
              id="fros"
              value={rosbridge}
              onChange={(e) => setRosbridge(e.target.value)}
              placeholder="ws://192.168.1.50:9090"
              spellCheck={false}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fvid">Video streamer base URL</Label>
            <Input
              id="fvid"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="http://192.168.1.50:8080"
              spellCheck={false}
            />
          </div>
          {formError && <p className="text-destructive text-xs">{formError}</p>}
          <Button type="submit" className="min-h-11 w-full">
            {editing ? "Save changes" : "Add robot"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} title="Delete robot?" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <div className="grid gap-4">
            <p className="text-muted-foreground text-sm">
              Remove <strong>{deleteTarget.name}</strong> from this browser? Connection presets are
              not affected until you reconnect.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="destructive"
                className="min-h-11 w-full sm:w-auto"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
