import { describe, expect, it } from "vitest";
import { INDICATOR_COLUMNS } from "@/lib/indicators";
import { buildAreas, type AreaQueryRow } from "@/lib/areas";

function makeRow(experiment: number, base: number, overrides: Partial<AreaQueryRow> = {}) {
  return {
    id: "42",
    experiment,
    name: "Bird Islands",
    name_fr: "Îles aux Oiseaux",
    source: "CPCAD",
    layer_type: "Protected Area",
    status: "Designated",
    designation_type: "Migratory Bird Sanctuary",
    iucn_category: "IV",
    manager: "Environment and Climate Change Canada",
    url: null,
    area_km2: 10.9,
    ClimVuln_min: base - 0.1,
    ClimVuln_max: base + 0.1,
    ...Object.fromEntries(INDICATOR_COLUMNS.map((c, i) => [c, base + i / 100])),
    ...overrides,
  } as AreaQueryRow;
}

function nullIndicators(): Partial<AreaQueryRow> {
  return {
    ClimVuln_min: null,
    ClimVuln_max: null,
    ...Object.fromEntries(INDICATOR_COLUMNS.map((c) => [c, null])),
  };
}

describe("buildAreas", () => {
  it("groups the two experiment rows into one Area with low/high scenarios", () => {
    const areas = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);

    expect(areas).toHaveLength(1);
    const area = areas[0];
    expect(area.id).toBe("42");
    expect(area.name).toBe("Bird Islands");
    expect(area.designation_type).toBe("Migratory Bird Sanctuary");
    expect(area.bbox).toBeNull();
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

  it("keeps areas whose indicators are null and passes the nulls through", () => {
    const [area] = buildAreas([
      makeRow(126, 0.2, nullIndicators()),
      makeRow(585, 0.6, nullIndicators()),
    ]);

    expect(area.id).toBe("42");
    const climVuln = area.indicator.find((i) => i.name === "ClimVuln");
    expect(climVuln?.scenario.low).toEqual({ min: null, mean: null, max: null });
    expect(climVuln?.scenario.high).toEqual({ min: null, mean: null, max: null });
  });

  it("drops areas missing one of the two experiments and sorts by name, then id", () => {
    const zebra = { id: "1", name: "Zebra Reef" };
    const orphan = makeRow(126, 0.4, { id: "2", name: "Alpha Bay" });
    const twin = { id: "7", name: "Bird Islands" };
    const areas = buildAreas([
      orphan,
      makeRow(126, 0.2, zebra),
      makeRow(585, 0.6, zebra),
      makeRow(126, 0.2, twin),
      makeRow(585, 0.6, twin),
      makeRow(126, 0.2),
      makeRow(585, 0.6),
    ]);

    expect(areas.map((a) => a.id)).toEqual(["42", "7", "1"]);
  });
});
