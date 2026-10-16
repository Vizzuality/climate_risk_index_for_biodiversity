import { describe, expect, it } from "vitest";
import { riskClassFor, riskColorFor } from "@/lib/risk-colormap";

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

describe("riskClassFor", () => {
  it("labels values with the class whose break they reach", () => {
    expect(riskClassFor(0.1).label).toBe("Negligible");
    expect(riskClassFor(0.2346).label).toBe("Moderate");
    expect(riskClassFor(0.4439).label).toBe("High");
    expect(riskClassFor(0.6501).label).toBe("Critical");
  });
});
