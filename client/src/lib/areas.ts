import { Area } from "@/containers/main/table/columns";
import { getDuckDBConnection, STATS_FILE } from "@/lib/duckdb";
import { buildIndicators, EXPERIMENT_TO_SCENARIO, type IndicatorRow } from "@/lib/indicators";
import { SCENARIO } from "@/types";

export type AreaQueryRow = {
  id: string;
  experiment: number;
  name: string;
  name_fr: string;
  source: string;
  area_type: string;
  status: string;
  designation_type: string;
  iucn_category: string;
  manager: string;
  url: string | null;
  area_km2: number | null;
  region: string | null;
  n_distinct_specid: number | null;
  // list<double> [xmin, ymin, xmax, ymax]; Arrow yields it as an iterable Vector
  bbox: Iterable<number> | null;
} & IndicatorRow;

// BIGINT columns are cast in SQL so Arrow yields numbers, not BigInts.
const AREAS_QUERY = `
  SELECT
    s.* REPLACE (
      CAST(s.experiment AS INTEGER) AS experiment,
      NULLIF(s.url, '') AS url
    )
  FROM '${STATS_FILE}' s
`;

function bbox(row: AreaQueryRow): Area["bbox"] {
  if (!row.bbox) return null;
  const [xmin, ymin, xmax, ymax] = row.bbox;
  return [xmin, ymin, xmax, ymax];
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
      area_type: low.area_type,
      status: low.status,
      designation_type: low.designation_type,
      iucn_category: low.iucn_category,
      manager: low.manager,
      url: low.url,
      area_km2: low.area_km2,
      assessed_species: low.n_distinct_specid,
      regions: low.region ? low.region.split(", ") : [],
      bbox: bbox(low),
      indicator: buildIndicators(low, high),
    });
  }
  return areas.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export async function fetchAreas(): Promise<Area[]> {
  const conn = await getDuckDBConnection();
  const result = await conn.query(AREAS_QUERY);
  return buildAreas(result.toArray().map((row) => row.toJSON() as AreaQueryRow));
}
