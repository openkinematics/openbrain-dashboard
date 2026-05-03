// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import {
  loadPreferences,
  rememberRobot,
  savePreferences,
} from "@/lib/preferences";

afterEach(() => {
  localStorage.clear();
});

describe("preferences", () => {
  it("returns defaults when nothing is stored", () => {
    const p = loadPreferences();
    expect(p.speedProfile).toBe("normal");
    expect(p.theme).toBe("system");
    expect(p.recentRobots).toEqual([]);
    expect(p.robots).toEqual([]);
    expect(p.dashboard.invertJoystickLR).toBe(false);
  });

  it("partial saves merge with existing values", () => {
    savePreferences({ speedProfile: "insane" });
    expect(loadPreferences().speedProfile).toBe("insane");
    savePreferences({ theme: "dark" });
    const p = loadPreferences();
    expect(p.speedProfile).toBe("insane");
    expect(p.theme).toBe("dark");
  });

  it("dashboard patches merge instead of replacing the whole object", () => {
    savePreferences({ dashboard: { invertJoystickLR: true } });
    const p = loadPreferences();
    expect(p.dashboard.invertJoystickLR).toBe(true);
    // Other fields should keep their defaults.
    expect(p.dashboard.videoTransport).toBe("auto");
    expect(p.dashboard.gamepadAngularAxisIndex).toBe(0);
  });

  it("rememberRobot deduplicates and caps at 5 entries", () => {
    rememberRobot("ws://a:9090");
    rememberRobot("ws://b:9090");
    rememberRobot("ws://c:9090");
    rememberRobot("ws://d:9090");
    rememberRobot("ws://e:9090");
    rememberRobot("ws://f:9090");
    rememberRobot("ws://a:9090"); // bumps a back to front
    const recent = loadPreferences().recentRobots;
    expect(recent.length).toBe(5);
    expect(recent[0]).toBe("ws://a:9090");
    expect(new Set(recent).size).toBe(5);
  });

  it("rememberRobot ignores blanks", () => {
    rememberRobot("");
    rememberRobot("   ");
    expect(loadPreferences().recentRobots).toEqual([]);
  });
});
