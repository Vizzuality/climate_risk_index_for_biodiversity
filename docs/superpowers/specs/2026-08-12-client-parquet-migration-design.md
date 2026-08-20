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
    `area_ha` (`O_AREA_HA`), `owner_en` (`OWNER_E`) and `mgmt_en` (`MGMT_E`)
    carried for later use,
  - `bbox_xmin`, `bbox_ymin`, `bbox_xmax`, `bbox_ymax` computed from decoded
    tile geometries.
  - *(Verified during design, 2026-08-12)* `NAME_E` is **not unique**: 14
    names cover multiple `OBJECTID`s (multi-zone areas, e.g.
    Banc-des-Américains has 3 features). The pre-agreed fallback applies:
    duplicated names get a deterministic ` (OBJECTID)` suffix in `name_en`,
    used consistently as display name and route param.
  - *(Verified)* No source field means "region" (`OWNER_E`/`MGMT_E` are
    owner/ministry names), so `admin_region` is **not emitted**; the detail
    view's existing "N/A" fallback renders. `ZONEDESC_E` is mostly null.
- Prep script `data-processing/scripts/build_mpas_metadata.py`:
  self-contained PEP 723 script (`uv run scripts/build_mpas_metadata.py`),
  deps `pmtiles`, `mapbox-vector-tile`, `pyarrow` — does not touch the Kedro
  environment. It decodes `client/data/mpas.pmtiles` at **max zoom only**
  (verified: z8 yields 577/578 features — lower zooms drop features),
  deduplicates features by `OBJECTID`, accumulates per-feature bboxes, and
  **fails loudly** if the row count ≠ 578 or names are still non-unique
  after disambiguation. Becoming a pipeline node is a later concern.

Known data losses/drifts vs wdpa.json, accepted for this iteration:

- No `website_url` (field becomes optional; UI link already conditional).
- No `admin_region` (see above; UI shows "N/A").
- Min/max exists only for `ClimVuln` (`ClimVuln_min`/`ClimVuln_max`); other
  indicators expose mean only (adapter sets min = max = mean).
- No categorical indicators (`ClimRisk`, `Clim*Risk`) — *(verified)* every
  UI consumer already filters to `type === "numerical"`, so nothing breaks.
- Indicator naming drift: phase-2 uses `Expo.toe` / `Sens.RLstatus` where
  wdpa.json and `categories-metadata.json` used `Expo.tow` /
  `Sens.rlstatus`. The parquet names are authoritative; the two keys in
  `categories-metadata.json` are renamed to match (labels unchanged).
- 588 → 578 areas (phase-2 vintage).
- Map-click navigation uses names promoted from the **phase-1 Mapbox
  tileset**; clicks on features whose phase-1 name has no phase-2 match
  (renamed, dropped, or suffix-disambiguated) land on an empty detail view.
  Accepted until the pmtiles iteration replaces the tilesets.

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
