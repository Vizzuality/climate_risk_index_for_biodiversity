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

- ~9 MB gzip of wasm downloads before the first query; boot latency is
  user-visible once. Hashed assets and the extension path are served
  `immutable` via nitro `routeRules` so repeat visits pay ~nothing.
- The duckdb parquet extension is self-hosted under
  `client/public/duckdb-extensions/<duckdb version>/wasm_mvp/` and pinned
  at boot via `SET custom_extension_repository` /
  `autoinstall_extension_repository` — no runtime dependency on
  `extensions.duckdb.org`. When bumping duckdb-wasm, re-download the
  extension matching the embedded duckdb version (`SELECT version()`).
- duckdb-wasm is not on the Vizzuality Tech Radar (flagged to the team;
  acceptable for a technical prototype). PMTiles is Assess-tier — the
  tiles migration needs its own discussion.
- Remote data (S3) becomes a URL swap in `src/lib/duckdb.ts`, but needs
  bucket CORS + `Range` support (see the PoC README findings).

## Amendment (2026-09-16)

The second phase-2 extract (1202 areas across Atlantic and Pacific
sources) keys areas on a string `id` and carries its own display
metadata (`name`, `source`, `designation_type`, `manager`, `url`,
`area_km2`, …). `mpas_metadata.parquet` and its join were removed; the
client reads `mpas_stats.parquet` alone and `id` is the route param and
the map-layer filter key. About a third of the areas have no indicator
values; they are kept and shown as "No data". Bbox is not in the extract,
so the fly-to is skipped until the next iteration decodes it from the
matching pmtiles, keyed on `id`.

## Amendment (2026-09-16, tiles)

The area geometries moved from the Mapbox-hosted tileset to
`client/src/data/mpas.pmtiles` (16 MB, 1202 features, layer `mpas`,
zoom 0–10), read directly by Mapbox GL JS: since 3.21 it detects the
`.pmtiles` extension on a vector source `url` and lazily loads its
official PMTiles provider from `api.mapbox.com` (the same host the
basemap already depends on). `mapbox-gl` was bumped 3.12 → 3.30 for it;
no `pmtiles` npm dependency and no tile server are needed. Vite serves
the archive as a hashed `/assets/*.pmtiles` with range requests, so the
remote-data iteration remains a URL swap. Per-area bbox is decoded from
the archive by `data-processing/scripts/build_mpas_bbox.py` into
`mpas_bbox.parquet`, left-joined to the stats on `id`. PMTiles is still
Assess-tier on the Tech Radar; acceptable for the prototype, flagged for
the production discussion.

The provider refuses servers that ignore `Range` (it throws "Check that
your storage backend supports HTTP Byte Serving"). Vite dev and Vercel's
static hosting answer 206; Nitro's `node-server` preset (`pnpm start`)
answers 200, so the areas layer does not load under a local production
run. Same constraint applies to any future remote bucket (CORS + Range).

## Amendment (2026-09-16, rasters)

The two emissions-scenario rasters moved from Mapbox-hosted vector
tilesets (pre-classified `val` 1–4) to Cloud-Optimized GeoTIFFs bundled
under `client/src/data/` (EPSG:3857, float32, band 1 = ClimVuln 0–1,
band 2 = 0/255 alpha, NaN wherever there is no modelled value, about half the grid including open ocean, 2.7 MB each). They render
through a deck.gl `MapboxOverlay` in interleaved mode using
`@developmentseed/deck.gl-geotiff`'s `COGLayer`, which range-reads the
COG overviews per tile. The library only infers a pipeline for unsigned
integer data, so the layer supplies its own: upload the two-band tile as
`rg32float`, discard NaN and alpha-0 pixels, then look up a 256-step
colour ramp with the four legend classes at 0.25 intervals (the same
thresholds as the chart). EPSG:3857 is resolved from a bundled PROJJSON
instead of the library's default epsg.io lookup, so the raster layer has
no third-party dependency on its critical path and any other CRS fails
loudly. Tech Radar: deck.gl is
Adopt; `@developmentseed/deck.gl-geotiff` is unlisted and pre-1.0
(0.7.0), accepted for the prototype. Same range-request constraint as
the parquet and PMTiles reads.
