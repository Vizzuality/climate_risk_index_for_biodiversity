import { SPECIES_PER_AREA_FILE, getDuckDBConnection } from "@/lib/duckdb";
import { EXPERIMENT_TO_SCENARIO } from "@/lib/indicators";
import type { SCENARIO } from "@/types";

// A species found in an area, with the mean of its ClimVuln over its cells in
// the area.
export type AreaSpecies = {
  species_id: number;
  common_name: string | null;
  scientific_name: string;
  ClimVuln: number;
};

export type AreaSpeciesRow = AreaSpecies & { experiment: number };

// The file is sorted by area id, so filtering on id alone prunes row groups
// by their id stats and one area costs a few range requests. Adding
// `experiment` to the filter makes DuckDB read every row group.
const SPECIES_PER_AREA_QUERY = `
  SELECT
    CAST(experiment AS INTEGER) AS experiment,
    species_id,
    common_name,
    scientific_name,
    ClimVuln
  FROM '${SPECIES_PER_AREA_FILE}'
  WHERE id = ?
  ORDER BY ClimVuln DESC, species_id
`;

// Rows keep their order, highest ClimVuln first.
export function buildAreaSpecies(rows: AreaSpeciesRow[]): Record<SCENARIO, AreaSpecies[]> {
  const species: Record<SCENARIO, AreaSpecies[]> = { low: [], high: [] };
  for (const { experiment, ...row } of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[experiment];
    if (scenario) species[scenario].push(row);
  }
  return species;
}

export async function fetchAreaSpecies(areaId: string): Promise<Record<SCENARIO, AreaSpecies[]>> {
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(SPECIES_PER_AREA_QUERY);
  try {
    const result = await statement.query(areaId);
    return buildAreaSpecies(result.toArray().map((row) => row.toJSON() as AreaSpeciesRow));
  } finally {
    await statement.close();
  }
}

// Case-insensitive substring match on the common or scientific name.
export function filterSpecies<T extends Pick<AreaSpecies, "common_name" | "scientific_name">>(
  species: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return species;
  return species.filter(
    ({ common_name, scientific_name }) =>
      scientific_name.toLowerCase().includes(q) || !!common_name?.toLowerCase().includes(q),
  );
}
