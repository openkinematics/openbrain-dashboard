import { describe, expect, it } from "vitest";
import { getIceServers } from "@/lib/env";

describe("getIceServers", () => {
  it("returns a STUN-only server list with the default Google STUN", () => {
    const list = getIceServers();
    expect(list.length).toBeGreaterThanOrEqual(1);
    const first = list[0];
    const urls = Array.isArray(first.urls) ? first.urls : [first.urls];
    expect(urls.some((u) => u.startsWith("stun:"))).toBe(true);
    // TURN env vars aren't set in tests → no TURN entry.
    expect(list.some((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => u.startsWith("turn:")))).toBe(
      false,
    );
  });
});
