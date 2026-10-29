import type { Area, IndicatorStats } from "@/containers/main/table/columns";
import { getDuckDBConnection, SPECIES_STATS_FILE } from "@/lib/duckdb";
import { buildIndicators, EXPERIMENT_TO_SCENARIO, type IndicatorRow } from "@/lib/indicators";
import type { SCENARIO } from "@/types";

// A species with its ClimVuln over its whole range, per scenario.
export type Species = {
  id: number;
  common_name: string | null;
  scientific_name: string;
  climate_risk: Record<SCENARIO, IndicatorStats>;
};

export type SpeciesQueryRow = {
  species_id: number;
  experiment: number;
  common_name: string | null;
  scientific_name: string;
  ClimVuln: number | null;
  ClimVuln_min: number | null;
  ClimVuln_max: number | null;
};

const SPECIES_QUERY = `
  SELECT
    species_id,
    experiment,
    common_name,
    scientific_name,
    ClimVuln,
    ClimVuln_min,
    ClimVuln_max
  FROM '${SPECIES_STATS_FILE}'
`;

const climateRisk = (row: SpeciesQueryRow): IndicatorStats => ({
  min: row.ClimVuln_min,
  mean: row.ClimVuln,
  max: row.ClimVuln_max,
});

// Common names come all lowercase from the source.
export const formatCommonName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

// The name a species is listed and sorted by.
export const speciesName = (species: Pick<Species, "common_name" | "scientific_name">) =>
  species.common_name ? formatCommonName(species.common_name) : species.scientific_name;

export function buildSpecies(rows: SpeciesQueryRow[]): Species[] {
  const rowsById = new Map<number, Partial<Record<SCENARIO, SpeciesQueryRow>>>();
  for (const row of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[row.experiment];
    if (!scenario) continue;
    const group = rowsById.get(row.species_id) ?? {};
    group[scenario] = row;
    rowsById.set(row.species_id, group);
  }

  const species: Species[] = [];
  for (const { low, high } of rowsById.values()) {
    if (!low || !high) continue;
    species.push({
      id: low.species_id,
      common_name: low.common_name,
      scientific_name: low.scientific_name,
      climate_risk: { low: climateRisk(low), high: climateRisk(high) },
    });
  }
  return species;
}

export async function fetchSpecies(): Promise<Species[]> {
  const conn = await getDuckDBConnection();
  const result = await conn.query(SPECIES_QUERY);
  return buildSpecies(result.toArray().map((row) => row.toJSON() as SpeciesQueryRow));
}

// A species with every indicator over its whole range, per scenario.
export type SpeciesDetail = Omit<Species, "climate_risk"> & { indicator: Area["indicator"] };

export type SpeciesDetailQueryRow = Omit<SpeciesQueryRow, "ClimVuln"> & IndicatorRow;

// The file is sorted by species_id, so filtering on it prunes row groups by
// their stats and one species costs a single row group read. The parameter
// comes in as a DOUBLE; casting it keeps the filter on the column untouched.
const SPECIES_DETAIL_QUERY = `
  SELECT *
  FROM '${SPECIES_STATS_FILE}'
  WHERE species_id = CAST(? AS INTEGER)
`;

export function buildSpeciesDetail(rows: SpeciesDetailQueryRow[]): SpeciesDetail | null {
  const byScenario: Partial<Record<SCENARIO, SpeciesDetailQueryRow>> = {};
  for (const row of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[row.experiment];
    if (scenario) byScenario[scenario] = row;
  }
  const { low, high } = byScenario;
  if (!low || !high) return null;
  return {
    id: low.species_id,
    common_name: low.common_name,
    scientific_name: low.scientific_name,
    indicator: buildIndicators(low, high),
  };
}

export async function fetchSpeciesDetail(speciesId: number): Promise<SpeciesDetail | null> {
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(SPECIES_DETAIL_QUERY);
  try {
    const result = await statement.query(speciesId);
    return buildSpeciesDetail(result.toArray().map((row) => row.toJSON() as SpeciesDetailQueryRow));
  } finally {
    await statement.close();
  }
}
