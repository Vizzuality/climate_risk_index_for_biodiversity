import { describe, expect, it } from "vitest";
import { riskColorFor } from "@/lib/risk-colormap";

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
