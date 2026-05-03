import { describe, expect, it } from "vitest";
import { clamp, formatBytes } from "@/lib/utils";

describe("clamp", () => {
  it("returns the value unchanged when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps below the minimum", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it("clamps above the maximum", () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
  it("works with negative ranges", () => {
    expect(clamp(0, -5, -1)).toBe(-1);
    expect(clamp(-10, -5, -1)).toBe(-5);
  });
});

describe("formatBytes", () => {
  it("renders zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("renders KB", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
  it("renders MB", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("caps at TB even for ridiculous inputs", () => {
    expect(formatBytes(1024 ** 5).endsWith("TB")).toBe(true);
  });
  it("returns 0 B for non-finite or negative", () => {
    expect(formatBytes(NaN)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
  });
});
