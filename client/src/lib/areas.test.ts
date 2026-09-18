import { describe, expect, it } from "vitest";
import { INDICATOR_COLUMNS } from "@/lib/indicators";
import { buildAreas, type AreaQueryRow } from "@/lib/areas";

function makeRow(experiment: number, base: number): AreaQueryRow {
  return {
    objectid: 42,
    experiment,
    name_en: "Bird Islands",
    type: "Migratory Bird Sanctuary",
    area_ha: 1092.9,
    bbox_xmin: -60.41,
    bbox_ymin: 46.35,
    bbox_xmax: -60.35,
    bbox_ymax: 46.39,
    ClimVuln_min: base - 0.1,
    ClimVuln_max: base + 0.1,
    ...Object.fromEntries(INDICATOR_COLUMNS.map((c, i) => [c, base + i / 100])),
  } as AreaQueryRow;
}

describe("buildAreas", () => {
  it("groups the two experiment rows into one Area with low/high scenarios", () => {
    const areas = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);

    expect(areas).toHaveLength(1);
    const area = areas[0];
    expect(area.objectid).toBe(42);
    expect(area.name_en).toBe("Bird Islands");
    expect(area.bbox).toEqual([-60.41, 46.35, -60.35, 46.39]);
    expect(area.indicator).toHaveLength(INDICATOR_COLUMNS.length);

    const hfrag = area.indicator.find((i) => i.name === "Adapt.hfrag");
    expect(hfrag?.type).toBe("numerical");
    expect(hfrag?.scenario.low.mean).toBeCloseTo(0.24);
    expect(hfrag?.scenario.high.mean).toBeCloseTo(0.64);
    // mean-only indicators collapse the range
    expect(hfrag?.scenario.low.min).toBe(hfrag?.scenario.low.mean);
    expect(hfrag?.scenario.low.max).toBe(hfrag?.scenario.low.mean);
  });

  it("gives ClimVuln its real min/max from the dedicated columns", () => {
    const [area] = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);
    const climVuln = area.indicator.find((i) => i.name === "ClimVuln");

    expect(climVuln?.scenario.low.min).toBeCloseTo(0.1);
    expect(climVuln?.scenario.low.max).toBeCloseTo(0.3);
    expect(climVuln?.scenario.high.min).toBeCloseTo(0.5);
    expect(climVuln?.scenario.high.max).toBeCloseTo(0.7);
  });

  it("drops areas missing one of the two experiments and sorts by name", () => {
    const complete126 = { ...makeRow(126, 0.2), objectid: 1, name_en: "Zebra Reef" };
    const complete585 = { ...makeRow(585, 0.6), objectid: 1, name_en: "Zebra Reef" };
    const orphan = { ...makeRow(126, 0.4), objectid: 2, name_en: "Alpha Bay" };
    const areas = buildAreas([
      orphan,
      complete126,
      complete585,
      makeRow(126, 0.2),
      makeRow(585, 0.6),
    ]);

    expect(areas.map((a) => a.name_en)).toEqual(["Bird Islands", "Zebra Reef"]);
  });
});
