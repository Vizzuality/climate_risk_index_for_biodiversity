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
