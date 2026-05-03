import { describe, expect, it } from "vitest";
import { makeDemoHealth } from "@/lib/demo-health";

describe("makeDemoHealth", () => {
  it("returns 8 cores by default with sane bounds", () => {
    const gen = makeDemoHealth();
    const msg = gen.next();
    expect(msg.cpu_per_core).toHaveLength(8);
    for (const v of msg.cpu_per_core) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("respects custom core count", () => {
    const gen = makeDemoHealth(4);
    expect(gen.next().cpu_per_core).toHaveLength(4);
  });

  it("keeps every metric inside its allowed band across many ticks", () => {
    const gen = makeDemoHealth(8);
    for (let i = 0; i < 500; i += 1) {
      const m = gen.next();
      for (const c of m.cpu_per_core) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(100);
      }
      // CPU temp jitter is allowed up to ~88 with the offset; assert a generous ceiling.
      expect(m.cpu_temp_c).toBeGreaterThan(40);
      expect(m.cpu_temp_c).toBeLessThan(95);
      expect(m.gpu_percent).toBeGreaterThanOrEqual(0);
      expect(m.gpu_percent).toBeLessThanOrEqual(100);
      expect(m.gpu_temp_c).toBeGreaterThan(40);
      expect(m.gpu_temp_c).toBeLessThan(95);
      expect(m.ram_used_bytes).toBeLessThanOrEqual(m.ram_total_bytes);
      expect(m.ram_used_bytes).toBeGreaterThan(0);
      expect(m.thermal_zones.length).toBeGreaterThan(0);
      expect(m.power_rails.length).toBeGreaterThan(0);
    }
  });

  it("uptime monotonically increases", () => {
    const gen = makeDemoHealth();
    const a = gen.next().uptime_s;
    // Bump time deterministically so we don't have to wait.
    const b = gen.next().uptime_s;
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
