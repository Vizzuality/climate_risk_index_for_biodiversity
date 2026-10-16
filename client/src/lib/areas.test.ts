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
    area_type: "MPA",
    status: "Designated",
    designation_type: "Migratory Bird Sanctuary",
    iucn_category: "IV",
    manager: "Environment and Climate Change Canada",
    url: null,
    area_km2: 10.9,
    region: "Scotian Shelf and Bay of Fundy, The Estuary and the Gulf of St. Lawrence",
    n_distinct_specid: 12.4,
    ClimVuln_min: base - 0.1,
    ClimVuln_max: base + 0.1,
    // typed array, not a plain array, like the Arrow Vector duckdb-wasm returns
    bbox: Float64Array.of(-60.41, 46.35, -60.35, 46.39),
    top_species: [
      { id: 137115, common_name: "beluga", scientific_name: "Delphinapterus leucas", score: base },
      { id: 157545, common_name: null, scientific_name: "Proclea graffii", score: base - 0.1 },
    ],
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

  it("keeps the top species of each scenario in rank order", () => {
    const [area] = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);

    expect(area.species.low.map((s) => s.scientific_name)).toEqual([
      "Delphinapterus leucas",
      "Proclea graffii",
    ]);
    expect(area.species.low[1]).toEqual({
      id: 157545,
      common_name: null,
      scientific_name: "Proclea graffii",
      score: 0.1,
    });
    expect(area.species.high[0].score).toBe(0.6);
  });

  it("gives an empty species list to a scenario without top species", () => {
    const [area] = buildAreas([makeRow(126, 0.2, { top_species: null }), makeRow(585, 0.6)]);

    expect(area.species.low).toEqual([]);
    expect(area.species.high).toHaveLength(2);
  });

  it("leaves bbox null when the area has no bbox", () => {
    const noBbox = { bbox: null };
    const [area] = buildAreas([makeRow(126, 0.2, noBbox), makeRow(585, 0.6, noBbox)]);

    expect(area.bbox).toBeNull();
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

  it("splits the comma-separated bioregions and treats an empty one as none", () => {
    const [area] = buildAreas([makeRow(126, 0.4), makeRow(585, 0.6)]);
    expect(area.regions).toEqual([
      "Scotian Shelf and Bay of Fundy",
      "The Estuary and the Gulf of St. Lawrence",
    ]);

    const [unassigned] = buildAreas([
      makeRow(126, 0.4, { region: "" }),
      makeRow(585, 0.6, { region: "" }),
    ]);
    expect(unassigned.regions).toEqual([]);
  });
});
