import { describe, expect, it } from "vitest";
import {
  buildSpeciesAreas,
  filterAreasByName,
  type SpeciesAreaRow,
  withAreaNames,
} from "@/lib/species-areas";

const row = (experiment: number, id: string, ClimVuln: number): SpeciesAreaRow => ({
  experiment,
  id,
  ClimVuln,
});

describe("buildSpeciesAreas", () => {
  it("splits the rows by scenario and keeps their order", () => {
    const areas = buildSpeciesAreas([
      row(126, "1", 0.7),
      row(585, "2", 0.8),
      row(126, "3", 0.5),
      row(585, "1", 0.6),
    ]);

    expect(areas.low.map((a) => a.id)).toEqual(["1", "3"]);
    expect(areas.high.map((a) => a.id)).toEqual(["2", "1"]);
    expect(areas.low[0]).toEqual({ id: "1", ClimVuln: 0.7 });
  });

  it("ignores unknown experiments and gives empty lists without rows", () => {
    expect(buildSpeciesAreas([row(370, "1", 0.5)])).toEqual({ low: [], high: [] });
  });
});

describe("withAreaNames", () => {
  it("adds the area names in order and drops unknown ids", () => {
    const named = withAreaNames(
      [
        { id: "2", ClimVuln: 0.8 },
        { id: "9", ClimVuln: 0.7 },
        { id: "1", ClimVuln: 0.6 },
      ],
      [
        { id: "1", name: "Gully" },
        { id: "2", name: "Banc-des-Américains" },
      ],
    );

    expect(named).toEqual([
      { id: "2", ClimVuln: 0.8, name: "Banc-des-Américains" },
      { id: "1", ClimVuln: 0.6, name: "Gully" },
    ]);
  });
});

describe("filterAreasByName", () => {
  const areas = [
    { id: "1", name: "Gully" },
    { id: "2", name: "Banc-des-Américains" },
    { id: "3", name: "Gilbert Bay" },
  ];

  it("matches the name, ignoring case and surrounding spaces, keeping the order", () => {
    expect(filterAreasByName(areas, " GULLY ").map((a) => a.id)).toEqual(["1"]);
    expect(filterAreasByName(areas, "g").map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("returns every area for an empty query", () => {
    expect(filterAreasByName(areas, "  ")).toBe(areas);
  });
});
