import { getDuckDBConnection, SPECIES_SAR_STATUS_FILE } from "@/lib/duckdb";

// A COSEWIC assessment of one population (designatable unit) of a species,
// with its legal status under SARA. Subspecies are listed under their
// species, so scientific_name may name a subspecies.
export type SarPopulation = {
  scientific_name: string;
  population: string | null;
  cosewic_status: string;
  cosewic_assessed: string | null;
  sara_status: string | null;
  sara_schedule: string | null;
};

// Most severe first; SARA uses the same names for its listings. Statuses not
// listed here sort last.
export const STATUSES = [
  "Extinct",
  "Extirpated",
  "Endangered",
  "Threatened",
  "Special Concern",
  "Data Deficient",
  "Not at Risk",
] as const;

const severity = (status: string) => {
  const index = STATUSES.indexOf(status as (typeof STATUSES)[number]);
  return index === -1 ? STATUSES.length : index;
};

// The SARA status of a population on Schedule 1, or null when it isn't
// legally listed.
export function saraListing({ sara_status, sara_schedule }: SarPopulation): string | null {
  if (sara_schedule !== "Schedule 1" || !sara_status || sara_status === "No Status") return null;
  return sara_status;
}

export type SarStatus = {
  // Most severe COSEWIC status first, then by population name.
  populations: SarPopulation[];
  // The most severe COSEWIC status over the populations, null when the
  // species hasn't been assessed.
  cosewicStatus: string | null;
  // The most severe SARA listing over the populations, null when none is
  // legally listed.
  saraStatus: string | null;
};

export function buildSarStatus(rows: SarPopulation[]): SarStatus {
  const populations = rows.toSorted(
    (a, b) =>
      severity(a.cosewic_status) - severity(b.cosewic_status) ||
      (a.population ?? "").localeCompare(b.population ?? ""),
  );
  const saraStatus =
    populations
      .map(saraListing)
      .filter((listing) => listing !== null)
      .toSorted((a, b) => severity(a) - severity(b))[0] ?? null;
  return { populations, cosewicStatus: populations[0]?.cosewic_status ?? null, saraStatus };
}

// The file is small and read whole. The parameter comes in as a DOUBLE;
// casting it keeps the filter on the column untouched. Dates are formatted in
// the query since duckdb-wasm returns DATE columns as epoch milliseconds.
const SAR_STATUS_QUERY = `
  SELECT
    sar_scientific_name AS scientific_name,
    population,
    cosewic_status,
    strftime(cosewic_assessed, '%Y') AS cosewic_assessed,
    sara_status,
    sara_schedule
  FROM '${SPECIES_SAR_STATUS_FILE}'
  WHERE species_id = CAST(? AS INTEGER)
`;

export async function fetchSarStatus(speciesId: number): Promise<SarStatus> {
  const conn = await getDuckDBConnection();
  const statement = await conn.prepare(SAR_STATUS_QUERY);
  try {
    const result = await statement.query(speciesId);
    return buildSarStatus(result.toArray().map((row) => row.toJSON() as SarPopulation));
  } finally {
    await statement.close();
  }
}
