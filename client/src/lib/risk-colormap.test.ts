import { describe, expect, it } from "vitest";
import { buildRiskColormap, COLORMAP_WIDTH, riskColorFor } from "@/lib/risk-colormap";

describe("riskColorFor", () => {
  it("maps values to the four legend classes at the Vulnerability breaks", () => {
    expect(riskColorFor(0)).toBe("#45B9C7");
    expect(riskColorFor(0.2345)).toBe("#45B9C7");
    expect(riskColorFor(0.2346)).toBe("#B5E2D1");
    expect(riskColorFor(0.4438)).toBe("#B5E2D1");
    expect(riskColorFor(0.4439)).toBe("#F1BC83");
    expect(riskColorFor(0.65)).toBe("#F1BC83");
    expect(riskColorFor(0.6501)).toBe("#D95730");
    expect(riskColorFor(1)).toBe("#D95730");
  });
});

describe("buildRiskColormap", () => {
  const texels = buildRiskColormap();
  const at = (i: number) => Array.from(texels.subarray(i * 4, i * 4 + 4));

  it("produces one opaque RGBA texel per colormap step", () => {
    expect(texels).toHaveLength(COLORMAP_WIDTH * 4);
    expect(at(0)).toEqual([0x45, 0xb9, 0xc7, 255]);
    expect(at(COLORMAP_WIDTH - 1)).toEqual([0xd9, 0x57, 0x30, 255]);
  });

  it("switches class at the first texel on or above each break", () => {
    const step = (v: number) => Math.ceil(v * (COLORMAP_WIDTH - 1));
    expect(at(step(0.2345909125689) - 1)).toEqual([0x45, 0xb9, 0xc7, 255]);
    expect(at(step(0.2345909125689))).toEqual([0xb5, 0xe2, 0xd1, 255]);
    expect(at(step(0.443899021417284) - 1)).toEqual([0xb5, 0xe2, 0xd1, 255]);
    expect(at(step(0.443899021417284))).toEqual([0xf1, 0xbc, 0x83, 255]);
    expect(at(step(0.650018122866379) - 1)).toEqual([0xf1, 0xbc, 0x83, 255]);
    expect(at(step(0.650018122866379))).toEqual([0xd9, 0x57, 0x30, 255]);
  });
});
