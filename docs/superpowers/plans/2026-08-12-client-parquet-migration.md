# Client Parquet Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `client/public/wdpa.json` with the phase-2 parquet files (`mpas_stats.parquet` + a generated `mpas_metadata.parquet`), read in the browser via duckdb-wasm, keeping the existing UI working.

**Architecture:** A one-off Python script decodes `client/data/mpas.pmtiles` into a metadata parquet. In the client, a lazy duckdb-wasm singleton (`src/lib/duckdb.ts`) registers both parquet files (served as Vite `?url` assets from `src/data/`); `src/lib/areas.ts` runs one SQL join and adapts the 1156 rows into the existing `Area[]` shape behind the unchanged `useAreas()` hook.

**Tech Stack:** TanStack Start (Vite), @duckdb/duckdb-wasm 1.32.0 (single-threaded MVP bundle), TanStack Query, Vitest; Python side: uv + PEP 723 script with pmtiles, mapbox-vector-tile, pyarrow.

**Spec:** `docs/superpowers/specs/2026-08-12-client-parquet-migration-design.md`

## Global Constraints

- Client commands run in `client/` with pnpm (`pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format`). Python runs via `uv` from `data-processing/`.
- Dependencies are pinned **exact** (no `^`/`~`): install duckdb-wasm as `@duckdb/duckdb-wasm@1.32.0`. Do NOT use npm dist-tag `latest` (it points at a dev build).
- Conventional Commits (`feat(client): …`, `docs: …`); body explains the why. Commit from the repo root; pre-commit hooks must pass.
- New/edited code uses **named exports** (existing default exports stay as they are).
- Minimal comments: only constraints the code can't show. No ticket/tool references.
- Branch: `feat/client-parquet-data-layer` (already created; spec is committed there).
- duckdb-wasm code must never execute on the server (TanStack Start SSR) — it is only reachable from react-query `queryFn`s, plus an explicit `typeof window` guard.
- Experiment → scenario mapping: `126 → "low"`, `585 → "high"` (SSP1-2.6 / SSP5-8.5).
- Expected dataset shape: 578 areas × 2 experiments = 1156 stats rows.

---

### Task 1: Generate `mpas_metadata.parquet` and stage both parquet files

**Files:**
- Create: `data-processing/scripts/build_mpas_metadata.py`
- Create (generated): `client/src/data/mpas_metadata.parquet`
- Create (copied): `client/src/data/mpas_stats.parquet`

**Interfaces:**
- Consumes: `client/data/mpas.pmtiles` and `client/data/mpas_stats.parquet` (gitignored staging inputs, already present).
- Produces: `client/src/data/mpas_metadata.parquet` with columns `objectid` (int32), `name_en`, `type`, `owner_en`, `mgmt_en` (utf8, nullable), `area_ha`, `bbox_xmin`, `bbox_ymin`, `bbox_xmax`, `bbox_ymax` (float64). One row per OBJECTID, 578 rows, `name_en` unique. Task 4's SQL join relies on these exact column names.

Facts verified during design (do not re-derive): the pmtiles layer is `marine_protected_areas_2023_atlantic`, zoom 0–14, tiles are gzip-compressed MVT with extent 4096; **only max zoom contains all 578 features** (z8 has 577). `NAME_E` has 14 duplicated names → disambiguate with an ` (OBJECTID)` suffix. `mapbox_vector_tile.decode` returns y-up tile-local coordinates (py=0 = south edge).

- [ ] **Step 1: Write the script**

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["pmtiles", "mapbox-vector-tile", "pyarrow"]
# ///
"""Build client/src/data/mpas_metadata.parquet from client/data/mpas.pmtiles.

One row per OBJECTID with display metadata and a lon/lat bbox, decoded from
the archive's max-zoom tiles (lower zooms drop features). NAME_E is not
unique in the source (multi-zone areas); duplicated names get an
" (OBJECTID)" suffix so the client can key routes on the name.
"""

import gzip
import math
from pathlib import Path

import mapbox_vector_tile
import pyarrow as pa
import pyarrow.parquet as pq
from pmtiles.reader import MmapSource, Reader, all_tiles

REPO_ROOT = Path(__file__).resolve().parents[2]
PMTILES_PATH = REPO_ROOT / "client" / "data" / "mpas.pmtiles"
OUT_PATH = REPO_ROOT / "client" / "src" / "data" / "mpas_metadata.parquet"
LAYER = "marine_protected_areas_2023_atlantic"
EXPECTED_FEATURES = 578


def tile_px_to_lonlat(z: int, x: int, y: int, extent: int, px: float, py: float):
    # clamp to the tile so buffer geometry doesn't bleed into the bbox
    px = min(max(px, 0), extent)
    py = min(max(py, 0), extent)
    n = 2**z
    lon = (x + px / extent) / n * 360.0 - 180.0
    # mapbox_vector_tile decodes y-up: py=0 is the tile's south edge
    y_global = y + 1 - py / extent
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y_global / n))))
    return lon, lat


def iter_points(coords):
    if isinstance(coords[0], (int, float)):
        yield coords
    else:
        for part in coords:
            yield from iter_points(part)


def main() -> None:
    with open(PMTILES_PATH, "rb") as f:
        max_zoom = Reader(MmapSource(f)).header()["max_zoom"]

    props_by_id: dict[int, dict] = {}
    bbox_by_id: dict[int, list[float]] = {}
    tiles = 0
    with open(PMTILES_PATH, "rb") as f:
        for (z, x, y), data in all_tiles(MmapSource(f)):
            if z != max_zoom:
                continue
            tiles += 1
            if tiles % 20000 == 0:
                print(f"  {tiles} tiles scanned, {len(props_by_id)} features…")
            raw = gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data
            layer = mapbox_vector_tile.decode(raw)[LAYER]
            extent = layer["extent"]
            for feat in layer["features"]:
                oid = int(feat["properties"]["OBJECTID"])
                props_by_id.setdefault(oid, feat["properties"])
                bbox = bbox_by_id.setdefault(oid, [180.0, 90.0, -180.0, -90.0])
                for px, py in iter_points(feat["geometry"]["coordinates"]):
                    lon, lat = tile_px_to_lonlat(z, x, y, extent, px, py)
                    bbox[0] = min(bbox[0], lon)
                    bbox[1] = min(bbox[1], lat)
                    bbox[2] = max(bbox[2], lon)
                    bbox[3] = max(bbox[3], lat)

    assert len(props_by_id) == EXPECTED_FEATURES, (
        f"expected {EXPECTED_FEATURES} features, got {len(props_by_id)}"
    )

    oids_by_name: dict[str, list[int]] = {}
    for oid, props in props_by_id.items():
        oids_by_name.setdefault(props["NAME_E"], []).append(oid)
    name_by_id = {
        oid: name if len(oids) == 1 else f"{name} ({oid})"
        for name, oids in oids_by_name.items()
        for oid in oids
    }
    assert len(set(name_by_id.values())) == EXPECTED_FEATURES, (
        "name_en not unique after disambiguation"
    )

    oids = sorted(props_by_id)
    table = pa.table(
        {
            "objectid": pa.array(oids, pa.int32()),
            "name_en": pa.array([name_by_id[o] for o in oids], pa.utf8()),
            "type": pa.array([props_by_id[o].get("TYPE_E") for o in oids], pa.utf8()),
            "owner_en": pa.array([props_by_id[o].get("OWNER_E") for o in oids], pa.utf8()),
            "mgmt_en": pa.array([props_by_id[o].get("MGMT_E") for o in oids], pa.utf8()),
            "area_ha": pa.array([props_by_id[o].get("O_AREA_HA") for o in oids], pa.float64()),
            "bbox_xmin": pa.array([bbox_by_id[o][0] for o in oids], pa.float64()),
            "bbox_ymin": pa.array([bbox_by_id[o][1] for o in oids], pa.float64()),
            "bbox_xmax": pa.array([bbox_by_id[o][2] for o in oids], pa.float64()),
            "bbox_ymax": pa.array([bbox_by_id[o][3] for o in oids], pa.float64()),
        }
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, OUT_PATH, compression="snappy")
    print(f"wrote {table.num_rows} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run from `data-processing/`: `uv run scripts/build_mpas_metadata.py`
Expected: progress lines, then `wrote 578 rows to …/client/src/data/mpas_metadata.parquet`. Takes a couple of minutes (~116k tiles at z14). If an assertion fires, stop and investigate — do not lower the expected count.

- [ ] **Step 3: Copy the stats parquet**

```bash
cp client/data/mpas_stats.parquet client/src/data/mpas_stats.parquet
```

- [ ] **Step 4: Verify both files with DuckDB**

```bash
uvx --from duckdb python -c "
import duckdb
print(duckdb.sql(\"\"\"
  SELECT count(*) AS joined,
         count(DISTINCT m.name_en) AS names,
         min(m.bbox_xmin) AS xmin, max(m.bbox_xmax) AS xmax
  FROM 'client/src/data/mpas_stats.parquet' s
  JOIN 'client/src/data/mpas_metadata.parquet' m
    ON m.objectid = CAST(s.OBJECTID AS INTEGER)
\"\"\"))
"
```

Expected: `joined = 1156`, `names = 578`, and xmin/xmax within the Atlantic bounds (roughly −71…−47). If `joined < 1156`, the join key is broken — stop.

- [ ] **Step 5: Commit**

```bash
git add data-processing/scripts/build_mpas_metadata.py client/src/data/mpas_metadata.parquet client/src/data/mpas_stats.parquet
git commit -m "feat(data): stage phase-2 parquet files for the client

mpas_stats.parquet is copied verbatim from the phase-2 outputs;
mpas_metadata.parquet is generated from mpas.pmtiles by the new
build_mpas_metadata.py script (max-zoom scan; NAME_E duplicates get an
OBJECTID suffix because 14 names cover multiple zones)."
```

---

### Task 2: Add duckdb-wasm and Vite/TS wiring

**Files:**
- Modify: `client/package.json` (via pnpm)
- Create: `client/src/parquet-url.d.ts`
- Modify: `client/vite.config.ts`

**Interfaces:**
- Produces: `import url from "@/data/<file>.parquet?url"` compiles; `@duckdb/duckdb-wasm` importable. Task 3 relies on both.

- [ ] **Step 1: Install the dependency (exact pin)**

Run in `client/`: `pnpm add @duckdb/duckdb-wasm@1.32.0`
Expected: `package.json` gains `"@duckdb/duckdb-wasm": "1.32.0"` (no caret).

- [ ] **Step 2: Declare the `?url` module type**

`tsconfig.json` has `"types": ["vite/client"]`, which doesn't know `.parquet`. Create `client/src/parquet-url.d.ts`:

```ts
declare module "*.parquet?url" {
  const url: string;
  export default url;
}
```

- [ ] **Step 3: Set the build target**

duckdb-wasm needs modern wasm/ESM features at build time. In `client/vite.config.ts`, add to the `defineConfig` object (sibling of `resolve`/`plugins`):

```ts
  build: {
    target: "esnext",
  },
```

- [ ] **Step 4: Typecheck**

Run in `client/`: `pnpm typecheck`
Expected: PASS (no new errors).

- [ ] **Step 5: Commit**

```bash
git add client/package.json client/pnpm-lock.yaml client/src/parquet-url.d.ts client/vite.config.ts
git commit -m "feat(client): add duckdb-wasm and parquet asset wiring

Pins 1.32.0 explicitly: the package's npm latest tag points at a dev
build. ?url module declaration is needed because tsconfig only loads
vite/client types, which don't cover .parquet assets."
```

---

### Task 3: DuckDB service singleton

**Files:**
- Create: `client/src/lib/duckdb.ts`

**Interfaces:**
- Consumes: `@duckdb/duckdb-wasm` 1.32.0; `@/data/mpas_stats.parquet?url`, `@/data/mpas_metadata.parquet?url` (Task 1 files, Task 2 wiring).
- Produces: `getDuckDBConnection(): Promise<AsyncDuckDBConnection>`, and the registered virtual filenames `STATS_FILE = "mpas_stats.parquet"`, `METADATA_FILE = "mpas_metadata.parquet"` usable as `FROM 'mpas_stats.parquet'` in SQL. Task 4 consumes all three.

No unit test for this module (per spec — it would only test the library); it is exercised by Task 5's app run.

- [ ] **Step 1: Write the module**

```ts
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import metadataUrl from "@/data/mpas_metadata.parquet?url";
import statsUrl from "@/data/mpas_stats.parquet?url";

export const STATS_FILE = "mpas_stats.parquet";
export const METADATA_FILE = "mpas_metadata.parquet";

let connection: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function boot(): Promise<duckdb.AsyncDuckDBConnection> {
  const worker = new Worker(duckdbWorkerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
  await db.instantiate(duckdbWasmUrl);
  // registerFileURL only records the URL; duckdb range-reads it per query,
  // which is what makes a later swap to remote files a URL change.
  const absolute = (url: string) => new URL(url, window.location.origin).href;
  await db.registerFileURL(STATS_FILE, absolute(statsUrl), duckdb.DuckDBDataProtocol.HTTP, false);
  await db.registerFileURL(
    METADATA_FILE,
    absolute(metadataUrl),
    duckdb.DuckDBDataProtocol.HTTP,
    false,
  );
  return db.connect();
}

export function getDuckDBConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("duckdb-wasm is browser-only"));
  }
  connection ??= boot().catch((error) => {
    connection = null;
    throw error;
  });
  return connection;
}
```

Notes for the implementer: we deliberately do NOT use `duckdb.selectBundle` — this app ships only the single-threaded MVP bundle (the threaded ones need COOP/COEP headers; see spec §2). The `catch` reset lets a failed boot retry on the next call instead of caching the rejection forever.

- [ ] **Step 2: Typecheck and lint**

Run in `client/`: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/duckdb.ts
git commit -m "feat(client): add lazy duckdb-wasm connection singleton

Single-threaded MVP bundle only (threaded bundles require COOP/COEP
response headers). Parquet files are registered as HTTP URLs so a later
remote-S3 iteration is a URL swap, not a restructure."
```

---

### Task 4: Indicator map + Area adapter (TDD)

**Files:**
- Create: `client/src/lib/indicators.ts`
- Create: `client/src/lib/areas.ts`
- Test: `client/src/lib/areas.test.ts`

**Interfaces:**
- Consumes: `getDuckDBConnection()`, `STATS_FILE`, `METADATA_FILE` from `@/lib/duckdb` (Task 3); `Area` type from `@/containers/main/table/columns` **as amended in Task 5** (adds `objectid: number`, makes `website_url`/`admin_region` optional — write against that shape now; typecheck fully passes after Task 5).
- Produces: `INDICATOR_COLUMNS: readonly string[]`, `EXPERIMENT_TO_SCENARIO: Record<number, SCENARIO>` (from `indicators.ts`); `buildAreas(rows: AreaQueryRow[]): Area[]` and `fetchAreas(): Promise<Area[]>` (from `areas.ts`). Task 5's `useAreas()` calls `fetchAreas`.

- [ ] **Step 1: Write `indicators.ts`** (data, not logic — no test)

```ts
import { SCENARIO } from "@/types";

export const EXPERIMENT_TO_SCENARIO: Record<number, SCENARIO> = {
  126: "low", // SSP1-2.6
  585: "high", // SSP5-8.5
};

// Column names in mpas_stats.parquet, also used as indicator names in the
// UI (categories-metadata.json keys must match them).
export const INDICATOR_COLUMNS = [
  "Sens.TSMr",
  "Sens.RLstatus",
  "Sens.HII",
  "Sens.vind",
  "Adapt.hfrag",
  "Adapt.lmax",
  "Adapt.hrange",
  "Adapt.tvar",
  "Expo.toe",
  "Expo.vel",
  "Expo.plost",
  "Expo.nrchng",
  "ClimSens",
  "ClimAdapt",
  "ClimExpo",
  "ClimVuln",
  "ClimSensSD",
  "ClimAdaptSD",
  "ClimExpoSD",
  "ClimVulnSD",
] as const;
```

- [ ] **Step 2: Write the failing adapter test** (`client/src/lib/areas.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { INDICATOR_COLUMNS } from "@/lib/indicators";
import { buildAreas, type AreaQueryRow } from "@/lib/areas";

function makeRow(experiment: number, base: number): AreaQueryRow {
  return {
    objectid: 42,
    experiment,
    name_en: "Bird Islands",
    type: "Migratory Bird Sanctuary",
    area_ha: 1092.9,
    bbox_xmin: -60.41,
    bbox_ymin: 46.35,
    bbox_xmax: -60.35,
    bbox_ymax: 46.39,
    ClimVuln_min: base - 0.1,
    ClimVuln_max: base + 0.1,
    ...Object.fromEntries(INDICATOR_COLUMNS.map((c, i) => [c, base + i / 100])),
  } as AreaQueryRow;
}

describe("buildAreas", () => {
  it("groups the two experiment rows into one Area with low/high scenarios", () => {
    const areas = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);

    expect(areas).toHaveLength(1);
    const area = areas[0];
    expect(area.objectid).toBe(42);
    expect(area.name_en).toBe("Bird Islands");
    expect(area.bbox).toEqual([-60.41, 46.35, -60.35, 46.39]);
    expect(area.indicator).toHaveLength(INDICATOR_COLUMNS.length);

    const hfrag = area.indicator.find((i) => i.name === "Adapt.hfrag");
    expect(hfrag?.type).toBe("numerical");
    expect(hfrag?.scenario.low.mean).toBeCloseTo(0.24);
    expect(hfrag?.scenario.high.mean).toBeCloseTo(0.64);
    // mean-only indicators collapse the range
    expect(hfrag?.scenario.low.min).toBe(hfrag?.scenario.low.mean);
    expect(hfrag?.scenario.low.max).toBe(hfrag?.scenario.low.mean);
  });

  it("gives ClimVuln its real min/max from the dedicated columns", () => {
    const [area] = buildAreas([makeRow(126, 0.2), makeRow(585, 0.6)]);
    const climVuln = area.indicator.find((i) => i.name === "ClimVuln");

    expect(climVuln?.scenario.low.min).toBeCloseTo(0.1);
    expect(climVuln?.scenario.low.max).toBeCloseTo(0.3);
    expect(climVuln?.scenario.high.min).toBeCloseTo(0.5);
    expect(climVuln?.scenario.high.max).toBeCloseTo(0.7);
  });

  it("drops areas missing one of the two experiments and sorts by name", () => {
    const complete126 = { ...makeRow(126, 0.2), objectid: 1, name_en: "Zebra Reef" };
    const complete585 = { ...makeRow(585, 0.6), objectid: 1, name_en: "Zebra Reef" };
    const orphan = { ...makeRow(126, 0.4), objectid: 2, name_en: "Alpha Bay" };
    const areas = buildAreas([
      orphan,
      complete126,
      complete585,
      makeRow(126, 0.2),
      makeRow(585, 0.6),
    ]);

    expect(areas.map((a) => a.name_en)).toEqual(["Bird Islands", "Zebra Reef"]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run in `client/`: `pnpm exec vitest run src/lib/areas.test.ts --reporter=agent`
Expected: FAIL — `@/lib/areas` does not exist.

- [ ] **Step 4: Write `areas.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run in `client/`: `pnpm exec vitest run src/lib/areas.test.ts --reporter=agent`
Expected: PASS (3 tests). Note: `pnpm typecheck` may still complain that `Area` has no `objectid` — that field lands in Task 5; the test file compiles because vitest doesn't run the project-wide typecheck.

- [ ] **Step 6: Commit**

```bash
git add client/src/lib/indicators.ts client/src/lib/areas.ts client/src/lib/areas.test.ts
git commit -m "feat(client): add parquet-to-Area adapter over duckdb

One SQL join across stats+metadata, then a pure adapter grouping the
two experiment rows (126=low, 585=high) into the existing Area shape.
Only ClimVuln carries real min/max in phase-2; other indicators
collapse to mean-only ranges."
```

---

### Task 5: Rewire `useAreas()`, amend `Area`, delete wdpa.json

**Files:**
- Modify: `client/src/containers/main/table/columns.tsx:7-30` (the `Area` type)
- Modify: `client/src/hooks/use-areas.ts`
- Modify: `client/src/data/categories-metadata.json` (two key renames)
- Delete: `client/public/wdpa.json`

**Interfaces:**
- Consumes: `fetchAreas()` from Task 4.
- Produces: `useAreas()` with unchanged signature (`UseQueryResult<Area[]>`); `Area` gains `objectid: number`, `website_url?: string`, `admin_region?: string`. Consumers (`use-selected-area.ts`, `components/map/index.tsx`, `containers/detail/*`, `containers/main/table/*`) need no changes beyond compiling against the amended type.

- [ ] **Step 1: Amend the `Area` type** in `client/src/containers/main/table/columns.tsx` — replace lines 7–13 (the scalar fields; keep the `indicator` array as is):

```ts
export type Area = {
  objectid: number;
  name_en: string;
  type: string;
  website_url?: string;
  area_ha: number;
  admin_region?: string;
  bbox: [number, number, number, number];
```

- [ ] **Step 2: Rewire the hook** — replace the whole `client/src/hooks/use-areas.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchAreas } from "@/lib/areas";

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
```

- [ ] **Step 3: Rename the two drifted metadata keys** in `client/src/data/categories-metadata.json`: key `"Expo.tow"` → `"Expo.toe"`, key `"Sens.rlstatus"` → `"Sens.RLstatus"` (values/labels unchanged — the parquet column names are authoritative, and the chart looks labels up by indicator name).

- [ ] **Step 4: Delete the old dataset**

```bash
git rm client/public/wdpa.json
```

- [ ] **Step 5: Full verification**

Run in `client/`: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all PASS. Then `rg -n "wdpa.json" client/src client/README.md` — expected: no hits in `src/` (README hits are handled in Task 6).

- [ ] **Step 6: Verify in the running app**

Run in `client/`: `pnpm dev` (needs `VITE_MAPBOX_TOKEN` in `.env.local`). In the browser check, in order:
1. Table renders 578 rows with names and "Overall climate risk" bars (duckdb boot takes a moment on first load — react-query's pending state shows meanwhile).
2. The scenario toggle (low/high) changes the bar values.
3. Clicking a table row navigates to the detail view: Region shows "N/A", Total area and area type populated, DFO site "N/A", radar chart renders 12 spokes.
4. The map flies to the selected area's bbox.
5. Network tab: two `.parquet` asset requests plus one `extensions.duckdb.org` request on first query (expected, documented); no `/wdpa.json` request.

- [ ] **Step 7: Commit**

```bash
git add client/src/containers/main/table/columns.tsx client/src/hooks/use-areas.ts client/src/data/categories-metadata.json
git commit -m "feat(client)!: read areas from phase-2 parquet instead of wdpa.json

useAreas() keeps its contract but now joins mpas_stats+mpas_metadata
via duckdb-wasm in the browser. Phase-2 carries no website_url or
admin_region (UI already falls back to N/A), and two indicator keys
drifted (Expo.toe, Sens.RLstatus) — categories-metadata.json follows
the parquet naming.

BREAKING CHANGE: dataset switches from 588 phase-1 areas to 578
phase-2 Atlantic MPAs; duplicated area names carry an (OBJECTID)
suffix, so previously shared /\$area URLs may no longer resolve."
```

---

### Task 6: Documentation (CLAUDE.md, README, ADRs)

**Files:**
- Modify: `CLAUDE.md` (repo root — the client "Data" bullet and any wdpa.json mentions)
- Modify: `client/README.md` (if it mentions wdpa.json — check with `rg -n "wdpa" client/README.md`)
- Create: `docs/adr/0001-record-architecture-decisions.md`
- Create: `docs/adr/0002-client-side-parquet-reads-via-duckdb-wasm.md`

**Interfaces:**
- Consumes: the shipped behavior from Tasks 1–5. Produces: docs only.

- [ ] **Step 1: Update `CLAUDE.md`** — in the client **Architecture → Data** bullet, replace the description of `public/wdpa.json` with the new flow. Replace the sentence starting "`public/wdpa.json` (protected areas, ~4 MB) is fetched client-side through `useAreas()`…" with:

```markdown
- **Data**: protected-area stats live in two parquet files under `src/data/` (`mpas_stats.parquet`, `mpas_metadata.parquet` — the latter generated by `data-processing/scripts/build_mpas_metadata.py` from `client/data/mpas.pmtiles`). They are read **in the browser** by duckdb-wasm (`src/lib/duckdb.ts`, lazy singleton, MVP bundle) and adapted into `Area[]` by `src/lib/areas.ts`, behind `useAreas()` (`src/hooks/use-areas.ts`, react-query, cached forever). `src/data/categories-metadata.json` (small chart metadata) stays bundled. There is no backend API. `use-selected-area.ts` resolves the current area by matching `name_en` against the route param. The map's fly-to reacts to `$area` + data readiness in a single effect in `components/map/index.tsx` (gated on the map `load` event). First parquet query fetches the duckdb parquet extension from `extensions.duckdb.org` (documented runtime dependency).
```

Also scan the rest of `CLAUDE.md` for stale `wdpa.json` mentions (`rg -n "wdpa" CLAUDE.md`) and update them the same way.

- [ ] **Step 2: Create the ADR directory with its founding record** — `docs/adr/0001-record-architecture-decisions.md`:

```markdown
# 0001 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-08-12

## Context

CRIB accumulates architectural choices (data transport, client engines,
tiling) whose reasoning is not visible in the code. Future contributors
need the "why", not just the diff.

## Decision

Record architecturally significant decisions as ADRs in `docs/adr/`,
numbered sequentially (`NNNN-kebab-case-title.md`), one screen each.

## Consequences

New significant decisions require a short ADR alongside the change.
```

- [ ] **Step 3: Write the duckdb ADR** — `docs/adr/0002-client-side-parquet-reads-via-duckdb-wasm.md`:

```markdown
# 0002 — Client-side parquet reads via duckdb-wasm

- **Status:** Accepted
- **Date:** 2026-08-12

## Context

The client consumed a 4.5 MB `wdpa.json` (phase-1). Phase-2 outputs are
parquet (`mpas_stats.parquet`, 171 KB, 578 areas × 2 experiments) plus a
pmtiles archive, and later iterations will fetch them remotely. A proof
of concept validated reading the parquet in the browser with duckdb-wasm.

## Decision

Read the parquet files in the browser with duckdb-wasm (single-threaded
MVP bundle, self-hosted via Vite `?url` assets, lazy singleton). A
generated `mpas_metadata.parquet` (names, bbox, area metadata decoded
from the pmtiles) joins the stats to feed the existing `Area[]` UI shape.

## Alternatives considered

- **hyparquet (~10 KB JS reader) + join in TS** — lighter by ~9 MB gzip
  and no worker boot; rejected to stay aligned with the PoC and keep SQL
  headroom for ad-hoc queries over larger phase-2 extracts.
- **Build-time parquet → JSON** — cheapest, but doesn't migrate the
  client to parquet and the remote iteration wouldn't build on it.

## Consequences

- ~9 MB gzip of wasm downloads before the first query (mitigate with
  immutable caching of hashed assets); boot latency is user-visible once.
- First parquet query fetches the parquet extension from
  `extensions.duckdb.org` — a runtime third-party dependency; self-host
  it if this ever blocks deployment.
- duckdb-wasm is not on the Vizzuality Tech Radar (flagged to the team;
  acceptable for a technical prototype). PMTiles is Assess-tier — the
  tiles migration needs its own discussion.
- Remote data (S3) becomes a URL swap in `src/lib/duckdb.ts`, but needs
  bucket CORS + `Range` support (see the PoC README findings).
```

- [ ] **Step 4: Update `client/README.md`** — if `rg -n "wdpa" client/README.md` hits, rewrite those lines to describe the parquet flow (same content as the CLAUDE.md bullet, shorter). If no hits, skip.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md client/README.md docs/adr/
git commit -m "docs: document client parquet data layer and record ADRs

Reconciles CLAUDE.md/README with the wdpa.json removal and records the
duckdb-wasm decision (ADR 0002), including the Tech Radar flag and the
extensions.duckdb.org runtime dependency."
```

---

## Post-plan verification (whole feature)

- [ ] `cd client && pnpm typecheck && pnpm lint && pnpm test && pnpm build` — all green (build confirms the wasm/worker/parquet assets emit correctly).
- [ ] `git status` — no untracked transient files (spike scripts live in the scratchpad, not the repo).
- [ ] The five in-app checks from Task 5 Step 6 pass on the built output too if feasible (`pnpm build && pnpm start`).
