import { describe, expect, it } from "vitest";
import { withDemoHref } from "@/lib/demo-routing";

describe("withDemoHref", () => {
  it("is a no-op when demoMode is false", () => {
    expect(withDemoHref("/cockpit", false)).toBe("/cockpit");
    expect(withDemoHref("/cockpit?other=1", false)).toBe("/cockpit?other=1");
  });

  it("appends ?demo=1 to a plain path", () => {
    expect(withDemoHref("/cockpit", true)).toBe("/cockpit?demo=1");
  });

  it("preserves existing query params", () => {
    expect(withDemoHref("/missions?keep=1", true)).toBe("/missions?keep=1&demo=1");
  });

  it("idempotent: existing demo=1 stays demo=1", () => {
    expect(withDemoHref("/cockpit?demo=1", true)).toBe("/cockpit?demo=1");
  });

  it("upgrades demo=0 to demo=1 when demoMode is on", () => {
    expect(withDemoHref("/cockpit?demo=0", true)).toBe("/cockpit?demo=1");
  });
});
