"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gamepad2, Eye, ShieldAlert } from "lucide-react";
import { useConnection, useTopic } from "@/components/ros";
import type { TwistMsg } from "@/lib/types";
import { useDashboardSettings } from "@/lib/use-dashboard-settings";
import { clamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface JoystickPadProps {
  /** Topic to publish on (default `/cmd_vel`). */
  topic?: string;
  /** Linear velocity scalar applied to the y-axis (m/s). */
  maxLinear?: number;
  /** Angular velocity scalar applied to the x-axis (rad/s). */
  maxAngular?: number;
  /** Enable Xbox/PS5 controller input via Gamepad API. */
  enableGamepad?: boolean;
  /** Publish rate in Hz (default 20). */
  rateHz?: number;
}

interface Vec2 {
  x: number;
  y: number;
}

const ZERO: Vec2 = { x: 0, y: 0 };

function applyDeadzone(value: number, dz = 0.08): number {
  return Math.abs(value) < dz ? 0 : value;
}

export function JoystickPad({
  topic = "/cmd_vel",
  maxLinear = 0.6,
  maxAngular = 1.2,
  enableGamepad = true,
  rateHz = 20,
}: JoystickPadProps) {
  const dash = useDashboardSettings();
  const { publish } = useTopic<TwistMsg>(topic, "geometry_msgs/Twist", { publishOnly: true });
  const { status: rosStatus } = useConnection(false);

  // Two independent input vectors — touch joystick + gamepad — composed at
  // publish time so either source works without contention.
  const touchVecRef = useRef<Vec2>(ZERO);
  const padVecRef = useRef<Vec2>(ZERO);

  const [touchVec, setTouchVec] = useState<Vec2>(ZERO);
  const [padConnected, setPadConnected] = useState(false);
  // Deadman: tab hidden, window unfocused, or rosbridge dropped → publish 0.
  const [deadman, setDeadman] = useState(false);

  const padRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number | null; rect: DOMRect | null }>({ id: null, rect: null });

  // ── Touch / mouse input on the on-screen joystick ──────────────────────────
  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = dragRef.current.rect;
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    const dx = (clientX - cx) / radius;
    const dy = (cy - clientY) / radius; // invert Y so up = +linear
    const mag = Math.hypot(dx, dy);
    const scale = mag > 1 ? 1 / mag : 1;
    const next = { x: clamp(dx * scale, -1, 1), y: clamp(dy * scale, -1, 1) };
    touchVecRef.current = next;
    setTouchVec(next);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, rect: target.getBoundingClientRect() };
    updateFromPointer(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.id !== e.pointerId) return;
    updateFromPointer(e.clientX, e.clientY);
  };
  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.id !== e.pointerId) return;
    dragRef.current = { id: null, rect: null };
    touchVecRef.current = ZERO;
    setTouchVec(ZERO);
  };

  // ── Gamepad polling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enableGamepad) return;
    let raf = 0;
    const tick = () => {
      const pads = navigator.getGamepads?.() ?? [];
      let pad: Gamepad | null = null;
      for (const p of pads)
        if (p) {
          pad = p;
          break;
        }
      if (pad) {
        setPadConnected(true);
        const axIdx = clamp(dash.gamepadAngularAxisIndex, 0, 7);
        const linIdx = clamp(dash.gamepadLinearAxisIndex, 0, 7);
        const ang = -applyDeadzone(pad.axes[axIdx] ?? 0);
        const lin = -applyDeadzone(pad.axes[linIdx] ?? 0);
        padVecRef.current = { x: ang, y: lin };
      } else {
        setPadConnected(false);
        padVecRef.current = ZERO;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enableGamepad, dash.gamepadAngularAxisIndex, dash.gamepadLinearAxisIndex]);

  // ── Deadman: page hidden / window blurred → zero out inputs and stop sending ─
  useEffect(() => {
    const evaluate = () => {
      const hidden = typeof document !== "undefined" && document.hidden;
      const focused = typeof document !== "undefined" ? document.hasFocus() : true;
      const dead = hidden || !focused;
      setDeadman(dead);
      if (dead) {
        touchVecRef.current = ZERO;
        padVecRef.current = ZERO;
        setTouchVec(ZERO);
      }
    };
    window.addEventListener("blur", evaluate);
    window.addEventListener("focus", evaluate);
    document.addEventListener("visibilitychange", evaluate);
    evaluate();
    return () => {
      window.removeEventListener("blur", evaluate);
      window.removeEventListener("focus", evaluate);
      document.removeEventListener("visibilitychange", evaluate);
    };
  }, []);

  // ── Publish loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = Math.max(20, Math.round(1000 / rateHz));
    const id = setInterval(() => {
      // Deadman + lost-connection → publish a zero Twist. Sending it
      // explicitly (rather than skipping the publish) ensures the bot stops
      // even if its controller had a stale velocity goal.
      const t = touchVecRef.current;
      const p = padVecRef.current;
      let tx = t.x;
      if (dash.invertJoystickLR) tx *= -1;
      const tAdj = { x: tx, y: t.y };
      const dominant = Math.hypot(p.x, p.y) > Math.hypot(tAdj.x, tAdj.y) ? p : tAdj;
      const viz = dash.joystickVisualizationOnly;
      const stopped = deadman || rosStatus !== "connected";
      const msg: TwistMsg = {
        linear: { x: stopped || viz ? 0 : dominant.y * maxLinear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: stopped || viz ? 0 : dominant.x * maxAngular },
      };
      void publish(msg);
    }, interval);
    return () => clearInterval(id);
  }, [
    publish,
    rateHz,
    maxLinear,
    maxAngular,
    dash.invertJoystickLR,
    dash.joystickVisualizationOnly,
    deadman,
    rosStatus,
  ]);

  const knobStyle = useMemo(
    () => ({
      transform: `translate(${touchVec.x * 50}%, ${-touchVec.y * 50}%)`,
    }),
    [touchVec],
  );

  const touchLin = touchVec.y * maxLinear;
  const touchOm = (dash.invertJoystickLR ? -touchVec.x : touchVec.x) * maxAngular;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="border-border bg-secondary/50 relative h-52 w-52 touch-none rounded-full border shadow-inner select-none sm:h-48 sm:w-48"
      >
        {/* Crosshair guides */}
        <div className="bg-border pointer-events-none absolute inset-x-0 top-1/2 h-px" />
        <div className="bg-border pointer-events-none absolute inset-y-0 left-1/2 w-px" />
        <div
          className="bg-primary absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg transition-transform duration-75 ease-out"
          style={knobStyle}
        />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-xs">
        <span>
          v: {touchLin.toFixed(2)} m/s · ω: {touchOm.toFixed(2)} rad/s
          {dash.joystickVisualizationOnly && <span className="text-warning ml-2">(not sent)</span>}
        </span>
        {dash.joystickVisualizationOnly && (
          <Badge variant="warning" className="gap-1">
            <Eye className="h-3 w-3" /> viz only
          </Badge>
        )}
        {deadman && (
          <Badge variant="warning" className="gap-1" title="Tab inactive — sending zero velocity">
            <ShieldAlert className="h-3 w-3" /> deadman
          </Badge>
        )}
        {padConnected && (
          <Badge variant="outline" className="gap-1">
            <Gamepad2 className="h-3 w-3" /> pad
          </Badge>
        )}
      </div>
    </div>
  );
}
