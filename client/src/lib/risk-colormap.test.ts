import { describe, expect, it } from "vitest";
import { buildRiskColormap, COLORMAP_WIDTH, riskColorFor } from "@/lib/risk-colormap";

describe("riskColorFor", () => {
  it("maps values to the four legend classes at 0.25 steps", () => {
    expect(riskColorFor(0)).toBe("#45B9C7");
    expect(riskColorFor(0.2499)).toBe("#45B9C7");
    expect(riskColorFor(0.25)).toBe("#B5E2D1");
    expect(riskColorFor(0.5)).toBe("#F1BC83");
    expect(riskColorFor(0.75)).toBe("#D95730");
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

  it("switches class at the 0.25 boundaries", () => {
    const step = (v: number) => Math.ceil(v * (COLORMAP_WIDTH - 1));
    expect(at(step(0.25) - 1)).toEqual([0x45, 0xb9, 0xc7, 255]);
    expect(at(step(0.25))).toEqual([0xb5, 0xe2, 0xd1, 255]);
    expect(at(step(0.5))).toEqual([0xf1, 0xbc, 0x83, 255]);
    expect(at(step(0.75))).toEqual([0xd9, 0x57, 0x30, 255]);
  });
});
