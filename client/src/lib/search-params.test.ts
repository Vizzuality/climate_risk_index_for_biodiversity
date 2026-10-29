import { describe, expect, it } from "vitest";
import { idList, percentByKey, stringifySearch } from "@/lib/search-params";

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

describe("idList", () => {
  const ids = idList();

  it("parses ids in ascending order without invalid or repeated ones", () => {
    expect(ids.parse("1043,812,abc,-5,1.5,,812")).toEqual(["812", "1043"]);
  });

  it("parses a single id the URL parser read as a number", () => {
    expect(ids.parse(812)).toEqual(["812"]);
  });

  it("parses anything else to no ids", () => {
    expect(ids.parse(undefined)).toEqual([]);
    expect(ids.parse(-812)).toEqual([]);
  });

  it("serializes equal selections to the same string", () => {
    expect(ids.serialize(["1043", "812", "812"])).toBe("812,1043");
    expect(ids.serialize([])).toBe("");
  });
});

describe("stringifySearch", () => {
  it("keeps commas and colons readable", () => {
    expect(stringifySearch({ opacity: "risk:60,areas:80" })).toBe("?opacity=risk:60,areas:80");
  });

  it("writes a single species id without quotes", () => {
    expect(stringifySearch({ species: "812", q: "812" })).toBe("?species=812&q=%22812%22");
  });
});
