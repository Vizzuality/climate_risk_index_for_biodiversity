import type { Area } from "@/containers/main/table/columns";
import { AREAS_PER_SPECIES_FILE, getDuckDBConnection } from "@/lib/duckdb";
import { EXPERIMENT_TO_SCENARIO } from "@/lib/indicators";
import type { SCENARIO } from "@/types";

// An area a species is found in, with the mean of the species' ClimVuln over
// its cells in the area.
export type SpeciesArea = {
  id: string;
  ClimVuln: number;
};

export type SpeciesAreaRow = SpeciesArea & { experiment: number };

// The file is sorted by species_id, so filtering on it prunes row groups by
// their stats and one species costs a few range requests. The parameter comes
// in as a DOUBLE; casting it keeps the filter on the column untouched.
const AREAS_PER_SPECIES_QUERY = `
  SELECT
    CAST(experiment AS INTEGER) AS experiment,
    id,
    ClimVuln
  FROM '${AREAS_PER_SPECIES_FILE}'
  WHERE species_id = CAST(? AS INTEGER)
  ORDER BY ClimVuln DESC, id
`;

// Rows keep their order, highest ClimVuln first.
export function buildSpeciesAreas(rows: SpeciesAreaRow[]): Record<SCENARIO, SpeciesArea[]> {
  const areas: Record<SCENARIO, SpeciesArea[]> = { low: [], high: [] };
  for (const { experiment, ...row } of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[experiment];
    if (scenario) areas[scenario].push(row);
  }
  return areas;
}

export async function fetchSpeciesAreas(
  speciesId: number,
): Promise<Record<SCENARIO, SpeciesArea[]>> {
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(AREAS_PER_SPECIES_QUERY);
  try {
    const result = await statement.query(speciesId);
    return buildSpeciesAreas(result.toArray().map((row) => row.toJSON() as SpeciesAreaRow));
  } finally {
    await statement.close();
  }
}

// The species' areas with their names, keeping the order; ids missing from
// the areas list are dropped.
export function withAreaNames<T extends SpeciesArea>(
  speciesAreas: T[],
  areas: Pick<Area, "id" | "name">[],
): (T & { name: string })[] {
  const names = new Map(areas.map(({ id, name }) => [id, name]));
  return speciesAreas.flatMap((area) => {
    const name = names.get(area.id);
    return name === undefined ? [] : [{ ...area, name }];
  });
}

// Case-insensitive substring match on the area name.
export function filterAreasByName<T extends Pick<Area, "name">>(areas: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return areas;
  return areas.filter(({ name }) => name.toLowerCase().includes(q));
}
