import { Area, IndicatorStats } from "@/containers/main/table/columns";
import { BBOX_FILE, getDuckDBConnection, STATS_FILE } from "@/lib/duckdb";
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
  bbox_xmin: number | null;
  bbox_ymin: number | null;
  bbox_xmax: number | null;
  bbox_ymax: number | null;
} & Record<(typeof INDICATOR_COLUMNS)[number], number | null>;

// BIGINT columns are cast in SQL so Arrow yields numbers, not BigInts.
const AREAS_QUERY = `
  SELECT
    s.* REPLACE (
      CAST(s.experiment AS INTEGER) AS experiment,
      NULLIF(s.url, '') AS url
    ),
    b.bbox_xmin, b.bbox_ymin, b.bbox_xmax, b.bbox_ymax
  FROM '${STATS_FILE}' s
  LEFT JOIN '${BBOX_FILE}' b USING (id)
`;

function bbox(row: AreaQueryRow): Area["bbox"] {
  const { bbox_xmin, bbox_ymin, bbox_xmax, bbox_ymax } = row;
  if (bbox_xmin === null || bbox_ymin === null || bbox_xmax === null || bbox_ymax === null) {
    return null;
  }
  return [bbox_xmin, bbox_ymin, bbox_xmax, bbox_ymax];
}

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
      bbox: bbox(low),
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
