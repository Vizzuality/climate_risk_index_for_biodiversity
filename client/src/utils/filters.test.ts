import { describe, expect, it } from "vitest";
import { filterAreas, filterByAreaName } from "@/utils/filters";
import { AREA_FILTER_DEFAULTS } from "@/containers/main/store";
import { Area } from "@/containers/main/table/columns";

const area = (name: string) => ({ name }) as Area;

const areas = [
  area("Bird Islands"),
  area("Eastern Shore Islands"),
  area("Gully Marine Protected Area"),
];

describe("filterByAreaName", () => {
  it("returns all areas when the search term is empty", () => {
    expect(filterByAreaName(areas, "")).toEqual(areas);
  });

  it("matches case-insensitively", () => {
    expect(filterByAreaName(areas, "bird")).toEqual([area("Bird Islands")]);
    expect(filterByAreaName(areas, "BIRD")).toEqual([area("Bird Islands")]);
  });

  it("matches partial names anywhere in the string", () => {
    expect(filterByAreaName(areas, "islands")).toEqual([
      area("Bird Islands"),
      area("Eastern Shore Islands"),
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterByAreaName(areas, "atlantis")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [...areas];
    filterByAreaName(input, "bird");
    expect(input).toEqual(areas);
  });
});

describe("filterAreas", () => {
  const typed = (name: string, layer_type: string) => ({ name, layer_type }) as Area;
  const typedAreas = [
    typed("Reserve", "MPA"),
    typed("Bank", "EBSA"),
    typed("Site", "Network Site"),
  ];

  it("returns the same list when no filter is active", () => {
    expect(filterAreas(typedAreas, AREA_FILTER_DEFAULTS)).toBe(typedAreas);
  });

  it("keeps areas of any selected protection type", () => {
    expect(filterAreas(typedAreas, { protection: ["pa", "network-site"] })).toEqual([
      typed("Reserve", "MPA"),
      typed("Site", "Network Site"),
    ]);
  });
});
