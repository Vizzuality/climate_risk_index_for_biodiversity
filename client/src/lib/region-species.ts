import { getDuckDBConnection, SPECIES_PER_AREA_FILE } from "@/lib/duckdb";

// The species found in any of the areas, under either scenario, so the
// selection doesn't change with the scenario. The file is sorted by area id,
// so an id list prunes row groups by their stats; joining the stats file in
// SQL instead reads every row group between the lowest and highest id.
export async function fetchSpeciesIdsInAreas(areaIds: readonly string[]): Promise<Set<number>> {
  if (!areaIds.length) return new Set();
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(`
    SELECT DISTINCT species_id
    FROM '${SPECIES_PER_AREA_FILE}'
    WHERE id IN (${areaIds.map(() => "?").join(", ")})
  `);
  try {
    const result = await statement.query(...areaIds);
    return new Set(result.toArray().map((row) => Number(row.species_id)));
  } finally {
    await statement.close();
  }
}
