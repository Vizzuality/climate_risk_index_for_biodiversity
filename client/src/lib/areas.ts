import { Area, IndicatorStats } from "@/containers/main/table/columns";
import { getDuckDBConnection, STATS_FILE } from "@/lib/duckdb";
import { EXPERIMENT_TO_SCENARIO, INDICATOR_COLUMNS } from "@/lib/indicators";
import { SCENARIO } from "@/types";

export type AreaQueryRow = {
  id: string;
  experiment: number;
  name: string;
  name_fr: string;
  source: string;
  layer_type: string;
  status: string;
  designation_type: string;
  iucn_category: string;
  manager: string;
  url: string | null;
  area_km2: number | null;
  ClimVuln_min: number | null;
  ClimVuln_max: number | null;
} & Record<(typeof INDICATOR_COLUMNS)[number], number | null>;

// BIGINT columns are cast in SQL so Arrow yields numbers, not BigInts.
const AREAS_QUERY = `
  SELECT * REPLACE (
    CAST(experiment AS INTEGER) AS experiment,
    NULLIF(url, '') AS url
  )
  FROM '${STATS_FILE}'
`;

function scenarioStats(
  row: AreaQueryRow,
  name: (typeof INDICATOR_COLUMNS)[number],
): IndicatorStats {
  const mean = row[name];
  return {
    min: name === "ClimVuln" ? row.ClimVuln_min : mean,
    mean,
    max: name === "ClimVuln" ? row.ClimVuln_max : mean,
  };
}

export function buildAreas(rows: AreaQueryRow[]): Area[] {
  const rowsById = new Map<string, Partial<Record<SCENARIO, AreaQueryRow>>>();
  for (const row of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[row.experiment];
    if (!scenario) continue;
    const group = rowsById.get(row.id) ?? {};
    group[scenario] = row;
    rowsById.set(row.id, group);
  }

  const areas: Area[] = [];
  for (const group of rowsById.values()) {
    const { low, high } = group;
    if (!low || !high) continue;
    areas.push({
      id: low.id,
      name: low.name,
      name_fr: low.name_fr,
      source: low.source,
      layer_type: low.layer_type,
      status: low.status,
      designation_type: low.designation_type,
      iucn_category: low.iucn_category,
      manager: low.manager,
      url: low.url,
      area_km2: low.area_km2,
      bbox: null,
      indicator: INDICATOR_COLUMNS.map((name) => ({
        name,
        type: "numerical" as const,
        scenario: {
          low: scenarioStats(low, name),
          high: scenarioStats(high, name),
        },
      })),
    });
  }
  return areas.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export async function fetchAreas(): Promise<Area[]> {
  const conn = await getDuckDBConnection();
  const result = await conn.query(AREAS_QUERY);
  return buildAreas(result.toArray().map((row) => row.toJSON() as AreaQueryRow));
}
