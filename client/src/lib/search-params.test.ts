import { describe, expect, it } from "vitest";
import { percentByKey, stringifySearch } from "@/lib/search-params";

const codec = percentByKey(["risk", "areas", "bioregions"] as const);

describe("percentByKey", () => {
  it("parses key:percent pairs", () => {
    expect(codec.parse("risk:60,areas:80")).toEqual({ risk: 60, areas: 80 });
  });

  it("snaps values to 10% steps and clamps them to 0–100", () => {
    expect(codec.parse("risk:64,areas:-20,bioregions:250")).toEqual({
      risk: 60,
      areas: 0,
      bioregions: 100,
    });
  });

  it("drops unknown keys, invalid values and repeated keys", () => {
    expect(codec.parse("stocks:50,risk:,areas:abc,bioregions,risk:40,risk:70")).toEqual({
      risk: 40,
    });
  });

  it("parses anything but a string to no entries", () => {
    expect(codec.parse(undefined)).toEqual({});
    expect(codec.parse(50)).toEqual({});
  });

  it("serializes in a fixed order without full-opacity entries", () => {
    expect(codec.serialize({ bioregions: 30, areas: 100, risk: 64 })).toBe("risk:60,bioregions:30");
    expect(codec.serialize({ risk: 100 })).toBe("");
  });
});

describe("stringifySearch", () => {
  it("keeps commas and colons readable", () => {
    expect(stringifySearch({ opacity: "risk:60,areas:80" })).toBe("?opacity=risk:60,areas:80");
  });
});
