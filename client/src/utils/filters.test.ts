import { describe, expect, it } from "vitest";
import { filterAreas, filterByAreaName } from "@/utils/filters";
import { NO_AREA_FILTERS } from "@/containers/main/store";
import { AREA_SIZE_VALUES } from "@/lib/area-sizes";
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
  const typed = (name: string, governance_type: string) => ({ name, governance_type }) as Area;
  const typedAreas = [typed("Reserve", "MCA"), typed("Bank", "EBSA"), typed("Site", "AOI")];

  it("returns the same list when no filter is active", () => {
    expect(filterAreas(typedAreas, NO_AREA_FILTERS)).toBe(typedAreas);
  });

  it("keeps areas of any selected protection type", () => {
    expect(filterAreas(typedAreas, { ...NO_AREA_FILTERS, protection: ["mca", "aoi"] })).toEqual([
      typed("Reserve", "MCA"),
      typed("Site", "AOI"),
    ]);
  });

  it("keeps areas touching any selected bioregion", () => {
    const located = (name: string, regions: string[]) => ({ name, regions }) as Area;
    const spanning = located("Spanning", ["Northern Shelf", "Southern Shelf"]);
    const locatedAreas = [spanning, located("Gulf", ["Strait of Georgia"]), located("Inland", [])];

    expect(filterAreas(locatedAreas, { ...NO_AREA_FILTERS, region: ["southern-shelf"] })).toEqual([
      spanning,
    ]);
    expect(
      filterAreas(locatedAreas, {
        ...NO_AREA_FILTERS,
        region: ["northern-shelf", "strait-of-georgia"],
      }),
    ).toEqual([spanning, located("Gulf", ["Strait of Georgia"])]);
  });

  it("keeps areas where any selected species occurs", () => {
    const withId = (id: string) => ({ id, name: id }) as Area;
    const speciesAreas = [withId("a"), withId("b"), withId("c")];

    expect(
      filterAreas(
        speciesAreas,
        { ...NO_AREA_FILTERS, species: ["812", "1043"] },
        new Set(["a", "c"]),
      ),
    ).toEqual([withId("a"), withId("c")]);
  });

  describe("size", () => {
    const sized = (name: string, area_km2: number | null) => ({ name, area_km2 }) as Area;
    const sizedAreas = [
      sized("Small", 1.99),
      sized("Lower edge", 2),
      sized("Upper edge", 10),
      sized("Large", 250),
      sized("Unknown", null),
    ];

    it("keeps areas in any selected range, comparing km² as hectares", () => {
      expect(filterAreas(sizedAreas, { ...NO_AREA_FILTERS, size: ["lt200", "gt1000"] })).toEqual([
        sized("Small", 1.99),
        sized("Upper edge", 10),
        sized("Large", 250),
      ]);
    });

    it("includes the lower bound and excludes the upper bound", () => {
      expect(filterAreas(sizedAreas, { ...NO_AREA_FILTERS, size: ["200-500"] })).toEqual([
        sized("Lower edge", 2),
      ]);
      expect(filterAreas(sizedAreas, { ...NO_AREA_FILTERS, size: ["500-1000"] })).toEqual([]);
    });

    it("hides areas without a size only while a size is selected", () => {
      const all = AREA_SIZE_VALUES.slice();
      expect(filterAreas(sizedAreas, { ...NO_AREA_FILTERS, size: all })).not.toContainEqual(
        sized("Unknown", null),
      );
      expect(filterAreas(sizedAreas, NO_AREA_FILTERS)).toContainEqual(sized("Unknown", null));
    });
  });
});
