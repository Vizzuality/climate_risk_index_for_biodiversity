import { describe, expect, it } from "vitest";
import { INDICATOR_COLUMNS } from "@/lib/indicators";
import {
  buildSpecies,
  buildSpeciesDetail,
  speciesName,
  type SpeciesDetailQueryRow,
  type SpeciesQueryRow,
} from "@/lib/species";

const row = (species_id: number, experiment: number, value: number): SpeciesQueryRow => ({
  species_id,
  experiment,
  common_name: species_id === 1 ? "Gray whale" : null,
  scientific_name: `Species ${species_id}`,
  ClimVuln: value,
  ClimVuln_min: value - 0.1,
  ClimVuln_max: value + 0.1,
});

describe("buildSpecies", () => {
  it("joins the scenarios of each species", () => {
    expect(buildSpecies([row(1, 126, 0.3), row(1, 585, 0.6)])).toEqual([
      {
        id: 1,
        common_name: "Gray whale",
        scientific_name: "Species 1",
        climate_risk: {
          low: { min: 0.3 - 0.1, mean: 0.3, max: 0.3 + 0.1 },
          high: { min: 0.6 - 0.1, mean: 0.6, max: 0.6 + 0.1 },
        },
      },
    ]);
  });

  it("drops species missing a scenario and ignores unknown experiments", () => {
    expect(buildSpecies([row(1, 126, 0.3), row(2, 126, 0.3), row(2, 370, 0.5)])).toEqual([]);
  });
});

describe("speciesName", () => {
  it("prefers the common name", () => {
    expect(speciesName({ common_name: "Beluga", scientific_name: "Delphinapterus leucas" })).toBe(
      "Beluga",
    );
    expect(speciesName({ common_name: null, scientific_name: "Proclea graffii" })).toBe(
      "Proclea graffii",
    );
  });
});

const detailRow = (experiment: number, base: number) =>
  ({
    species_id: 1,
    experiment,
    common_name: "Gray whale",
    scientific_name: "Eschrichtius robustus",
    ClimVuln_min: base - 0.1,
    ClimVuln_max: base + 0.1,
    ...Object.fromEntries(INDICATOR_COLUMNS.map((c, i) => [c, base + i / 100])),
  }) as SpeciesDetailQueryRow;

describe("buildSpeciesDetail", () => {
  it("joins the scenarios into every indicator", () => {
    const species = buildSpeciesDetail([detailRow(585, 0.6), detailRow(126, 0.2)]);
    expect(species).toMatchObject({
      id: 1,
      common_name: "Gray whale",
      scientific_name: "Eschrichtius robustus",
    });
    expect(species?.indicator).toHaveLength(INDICATOR_COLUMNS.length);
    expect(species?.indicator.find(({ name }) => name === "ClimVuln")?.scenario).toEqual({
      low: { min: 0.2 - 0.1, mean: detailRow(126, 0.2).ClimVuln, max: 0.2 + 0.1 },
      high: { min: 0.6 - 0.1, mean: detailRow(585, 0.6).ClimVuln, max: 0.6 + 0.1 },
    });
  });

  it("returns null when a scenario is missing", () => {
    expect(buildSpeciesDetail([detailRow(126, 0.2)])).toBeNull();
    expect(buildSpeciesDetail([])).toBeNull();
  });
});
