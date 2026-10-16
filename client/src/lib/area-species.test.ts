import { describe, expect, it } from "vitest";
import { buildAreaSpecies, filterSpecies, type AreaSpeciesRow } from "@/lib/area-species";

const row = (experiment: number, species_id: number, score: number): AreaSpeciesRow => ({
  experiment,
  species_id,
  common_name: null,
  scientific_name: `Species ${species_id}`,
  score,
});

describe("buildAreaSpecies", () => {
  it("splits the rows by scenario and keeps their order", () => {
    const species = buildAreaSpecies([
      row(126, 1, 0.7),
      row(585, 2, 0.8),
      row(126, 3, 0.5),
      row(585, 1, 0.6),
    ]);

    expect(species.low.map((s) => s.species_id)).toEqual([1, 3]);
    expect(species.high.map((s) => s.species_id)).toEqual([2, 1]);
    expect(species.low[0]).toEqual({
      species_id: 1,
      common_name: null,
      scientific_name: "Species 1",
      score: 0.7,
    });
  });

  it("ignores unknown experiments and gives empty lists without rows", () => {
    expect(buildAreaSpecies([row(370, 1, 0.5)])).toEqual({ low: [], high: [] });
  });
});

describe("filterSpecies", () => {
  const species = [
    {
      species_id: 1,
      common_name: "Gray whale",
      scientific_name: "Eschrichtius robustus",
      score: 0.7,
    },
    { species_id: 2, common_name: null, scientific_name: "Proclea graffii", score: 0.6 },
    { species_id: 3, common_name: "Beluga", scientific_name: "Delphinapterus leucas", score: 0.5 },
  ];

  it("matches either name, ignoring case and surrounding spaces, keeping the rank order", () => {
    expect(filterSpecies(species, " WHALE ").map((s) => s.species_id)).toEqual([1]);
    expect(filterSpecies(species, "proclea").map((s) => s.species_id)).toEqual([2]);
    expect(filterSpecies(species, "us").map((s) => s.species_id)).toEqual([1, 3]);
  });

  it("returns every species for an empty query", () => {
    expect(filterSpecies(species, "  ")).toBe(species);
  });
});
