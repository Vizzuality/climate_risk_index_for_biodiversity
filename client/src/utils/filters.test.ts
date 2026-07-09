import { describe, expect, it } from "vitest";
import { filterByAreaName } from "@/utils/filters";
import { Area } from "@/containers/main/table/columns";

const area = (name_en: string) => ({ name_en }) as Area;

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
