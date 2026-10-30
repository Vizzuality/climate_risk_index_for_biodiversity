import { BIOREGIONS, type Bioregion } from "@/lib/bioregions";
import { getDuckDBConnection, SPECIES_PER_BIOREGION_FILE } from "@/lib/duckdb";

export async function fetchSpeciesIdsInBioregions(
  bioregions: readonly Bioregion[],
): Promise<Set<number>> {
  const regions = BIOREGIONS.filter((bioregion) => bioregions.includes(bioregion.value)).map(
    (bioregion) => bioregion.region,
  );
  if (!regions.length) return new Set();
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(`
    SELECT DISTINCT species_id
    FROM '${SPECIES_PER_BIOREGION_FILE}'
    WHERE region IN (${regions.map(() => "?").join(", ")})
  `);
  try {
    const result = await statement.query(...regions);
    return new Set(result.toArray().map((row) => Number(row.species_id)));
  } finally {
    await statement.close();
  }
}
