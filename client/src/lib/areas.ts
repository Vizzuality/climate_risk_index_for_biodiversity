import { Area } from "@/containers/main/table/columns";
import { getDuckDBConnection, METADATA_FILE, STATS_FILE } from "@/lib/duckdb";
import { EXPERIMENT_TO_SCENARIO, INDICATOR_COLUMNS } from "@/lib/indicators";
import { SCENARIO } from "@/types";

export type AreaQueryRow = {
  objectid: number;
  experiment: number;
  name_en: string;
  type: string;
  area_ha: number;
  bbox_xmin: number;
  bbox_ymin: number;
  bbox_xmax: number;
  bbox_ymax: number;
  ClimVuln_min: number;
  ClimVuln_max: number;
} & Record<(typeof INDICATOR_COLUMNS)[number], number>;

// BIGINT columns are cast in SQL so Arrow yields numbers, not BigInts.
const AREAS_QUERY = `
  SELECT
    CAST(s.OBJECTID AS INTEGER) AS objectid,
    CAST(s.experiment AS INTEGER) AS experiment,
    m.name_en,
    m."type",
    m.area_ha,
    m.bbox_xmin, m.bbox_ymin, m.bbox_xmax, m.bbox_ymax,
    s.* EXCLUDE ("OBJECTID", experiment)
  FROM '${STATS_FILE}' s
  JOIN '${METADATA_FILE}' m ON m.objectid = CAST(s.OBJECTID AS INTEGER)
`;

function scenarioStats(row: AreaQueryRow, name: (typeof INDICATOR_COLUMNS)[number]) {
  const mean = row[name];
  return {
    min: name === "ClimVuln" ? row.ClimVuln_min : mean,
    mean,
    max: name === "ClimVuln" ? row.ClimVuln_max : mean,
  };
}

export function buildAreas(rows: AreaQueryRow[]): Area[] {
  const rowsById = new Map<number, Partial<Record<SCENARIO, AreaQueryRow>>>();
  for (const row of rows) {
    const scenario = EXPERIMENT_TO_SCENARIO[row.experiment];
    if (!scenario) continue;
    const group = rowsById.get(row.objectid) ?? {};
    group[scenario] = row;
    rowsById.set(row.objectid, group);
  }

  const areas: Area[] = [];
  for (const group of rowsById.values()) {
    const { low, high } = group;
    if (!low || !high) continue;
    areas.push({
      objectid: low.objectid,
      name_en: low.name_en,
      type: low.type,
      area_ha: low.area_ha,
      bbox: [low.bbox_xmin, low.bbox_ymin, low.bbox_xmax, low.bbox_ymax],
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
  return areas.sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export async function fetchAreas(): Promise<Area[]> {
  const conn = await getDuckDBConnection();
  const result = await conn.query(AREAS_QUERY);
  return buildAreas(result.toArray().map((row) => row.toJSON() as AreaQueryRow));
}
