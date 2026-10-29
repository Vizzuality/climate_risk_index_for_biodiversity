import { describe, expect, it } from "vitest";
import { formatAreaName } from "@/lib/area-name";

describe("formatAreaName", () => {
  it("uppercases a lowercase first letter and leaves the rest as is", () => {
    expect(formatAreaName("batture de la Rivière Mingan Water Fowl Gathering Area")).toBe(
      "Batture de la Rivière Mingan Water Fowl Gathering Area",
    );
  });

  it("title-cases all-caps names, starting words after spaces, hyphens, slashes and parentheses", () => {
    expect(formatAreaName("TAHSISH-KWOIS PARK")).toBe("Tahsish-Kwois Park");
    expect(formatAreaName("DUKE OF EDINBURGH (PINE/STORM/TREE ISLETS) ECOLOGICAL RESERVE")).toBe(
      "Duke of Edinburgh (Pine/Storm/Tree Islets) Ecological Reserve",
    );
  });

  it("keeps letters after an apostrophe lowercase", () => {
    expect(formatAreaName("K'DISTSAUSK/TURTLE POINT CONSERVANCY")).toBe(
      "K'distsausk/Turtle Point Conservancy",
    );
  });

  it("keeps connecting words lowercase mid-name", () => {
    expect(formatAreaName("LANZ AND COX ISLANDS PARK")).toBe("Lanz and Cox Islands Park");
  });

  it("leaves mixed-case names untouched", () => {
    expect(formatAreaName("Wapusk National Park Of Canada")).toBe("Wapusk National Park Of Canada");
    expect(formatAreaName("St. Anns Bank MPA")).toBe("St. Anns Bank MPA");
  });
});
