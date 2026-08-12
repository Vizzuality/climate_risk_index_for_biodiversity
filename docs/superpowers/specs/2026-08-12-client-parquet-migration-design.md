# Client data layer: wdpa.json → phase-2 parquet via duckdb-wasm

**Date:** 2026-08-12
**Status:** Approved design, pending implementation plan

## Goal

Replace the client's bundled phase-1 dataset (`client/public/wdpa.json`, 4.5 MB,
588 areas) with the phase-2 outputs (`mpas_stats.parquet`, 171 KB, 578 Atlantic
MPAs × 2 emission experiments), read in the browser with duckdb-wasm, following
the approach validated by the `~/Developer/demo-parquet` proof of concept.

This iteration keeps the parquet files local to the app. Remote fetching (S3)
and replacing the Mapbox-hosted tilesets with `mpas.pmtiles` are explicitly
later iterations.

## Decisions taken (with the why)

| Decision | Choice | Why |
| --- | --- | --- |
| Dataset | Phase-2 parquet as-is; client adapts | The phase-2 data is the product direction; no upstream schema changes requested |
| Metadata gap | Generate a companion `mpas_metadata.parquet` | Stats parquet has no names/bbox/area fields; vector tiles can't feed a table; keeps the stats file untouched |
| UI scope | Keep current UI, adapt the data layer | Smallest coherent change; ±SD-aware UI redesign is a later iteration |
| Detail route | Keep human-readable name (`/$area` = `name_en`) | Shareable URLs; `NAME_E → OBJECTID` resolved via metadata; uniqueness enforced at prep time |
| Read engine | duckdb-wasm (single-threaded MVP bundle) | Continuity with the PoC; SQL headroom for later ad-hoc queries / bigger extracts; remote iteration becomes a URL swap. Cost accepted: ~9 MB gzip wasm + worker boot for 171 KB of data (the PoC README documents this trade-off) |
| File serving | `client/src/data/*.parquet` + Vite `?url` asset imports | No `public/` involvement; content-hashed URLs → immutable caching; same mechanism the PoC uses for the wasm binary itself. Note: bytes are still browser-downloadable either way — duckdb-wasm runs client-side |

**Tech Radar flags (org policy):** DuckDB/duckdb-wasm is not listed on the
Vizzuality Tech Radar — flagged to the team via this spec and the ADR below.
PMTiles is *Assess* (exploration only), relevant when the tiles iteration
happens. CRIB is a technical prototype, which the team accepted as adequate
context for both.

## 1. Data files & prep

- `client/src/data/mpas_stats.parquet` — copied verbatim from `client/data/`
  (gitignored staging area). Committed; replaces the 4.5 MB `wdpa.json`.
- `client/src/data/mpas_metadata.parquet` — **new**, one row per `OBJECTID`
  (578 expected):
  - `objectid` (join key), `name_en` (`NAME_E`), `type` (`TYPE_E`),
    `area_ha` (`O_AREA_HA`), `admin_region` (best available source field —
    candidate `OWNER_E` or `MGMT_E`, to be confirmed against real values;
    null is acceptable, the detail view already renders "N/A"),
  - `bbox_xmin`, `bbox_ymin`, `bbox_xmax`, `bbox_ymax` computed from decoded
    tile geometries.
- Prep script `data-processing/scripts/build_mpas_metadata.py`:
  self-contained PEP 723 script (`uv run scripts/build_mpas_metadata.py`),
  deps `pmtiles`, `mapbox-vector-tile`, `pyarrow` — does not touch the Kedro
  environment. It decodes `client/data/mpas.pmtiles` at max zoom,
  deduplicates features by `OBJECTID`, accumulates per-feature bboxes, and
  **fails loudly** if `NAME_E` is not unique (the route param and
  `useSelectedArea` depend on it) or if the row count ≠ 578.
  Becoming a pipeline node is a later concern.

Known data losses vs wdpa.json, accepted for this iteration:

- No `website_url` (field becomes optional; UI link already conditional).
- Min/max exists only for `ClimVuln` (`ClimVuln_min`/`ClimVuln_max`); other
  indicators expose mean only (adapter sets min = max = mean).
- 588 → 578 areas (phase-2 vintage).

## 2. DuckDB service — `client/src/lib/duckdb.ts`

- Self-hosted single-threaded **MVP bundle** via Vite `?url` imports (no
  COOP/COEP requirement), booted in a Web Worker — same shape as the PoC's
  `src/duckdb.js`.
- Lazy singleton: the first call boots the engine, registers both parquet
  URLs with `registerFileURL(name, url, DuckDBDataProtocol.HTTP, false)`
  (lazy HTTP range reads — the property that makes the remote-S3 iteration a
  URL swap), and caches the connection promise. Subsequent callers await the
  same promise.
- Browser-only: only reached from react-query `queryFn`s (client-side, as
  today's relative-URL fetch already is), plus a `typeof window` guard so an
  accidental server import fails explicitly under TanStack Start SSR.
- Vite config: a `*.parquet?url` module declaration for TypeScript
  (`?url` imports work for arbitrary file types; add
  `assetsInclude: ["**/*.parquet"]` only if Vite complains), and
  `build.target: "esnext"` if not already satisfied (duckdb-wasm needs
  modern wasm features).
- **Known runtime dependency, documented:** the first parquet query fetches
  the parquet extension wasm from `extensions.duckdb.org`. Accepted for the
  prototype; self-hosting the extension is a noted follow-up.

## 3. Adapter & hooks — the only surface consumers see

- `client/src/lib/indicators.ts`: typed port of the PoC's `metrics.js`
  column map (`Sens.*`, `Adapt.*`, `Expo.*`, composite `Clim*` + SD columns;
  experiments `126` / `585`).
- `client/src/lib/areas.ts`: one SQL join
  (`metadata m JOIN stats s USING (OBJECTID)` → 1156 rows) and a pure
  adapter function that groups the two experiment rows per area into the
  existing `Area` shape:
  - `experiment 126 → scenario.low`, `585 → scenario.high`;
  - `ClimVuln` keeps real min/mean/max; other indicators min = max = mean;
  - `Area` gains `objectid: number`; `website_url` becomes optional;
    all other field names unchanged.
- `useAreas()` keeps its exact signature — the queryFn awaits the duckdb
  singleton and runs the join instead of `fetch("/wdpa.json")`. Errors and
  loading surface through the existing react-query states. Table, detail
  view, `useSelectedArea` (name match), and map fly-to (bbox) keep working
  with near-zero changes.
- `client/public/wdpa.json` and the old fetch path are deleted in the same
  change.

## 4. Out of scope (later iterations)

- Remote parquet from S3 — CORS/presign findings are documented in the PoC
  README; that iteration is a URL swap on this design.
- `mpas.pmtiles` + MapLibre instead of Mapbox-hosted tilesets (Tech Radar:
  PMTiles = Assess). Until then the map choropleth renders phase-1 Mapbox
  tilesets while table/detail show phase-2 numbers — accepted temporary
  inconsistency.
- UI redesign around mean ± SD; threaded (COOP/COEP) duckdb bundle;
  self-hosting the duckdb parquet extension.

## 5. Testing, error handling, docs

- **Tests:** one unit test for the adapter (fixture rows → grouped `Area`;
  scenario mapping; ClimVuln min/max vs mean-only indicators). The duckdb
  service itself is not unit-tested (it would test the library); it is
  verified by running the app.
- **Error handling:** duckdb boot or query failure rejects the queryFn →
  existing react-query error states; no new error UI this iteration.
- **Docs:** update `CLAUDE.md` (client data section) and client README;
  add an ADR recording the duckdb-wasm choice, its trade-off (engine size
  vs data size), and the Tech Radar flag.
