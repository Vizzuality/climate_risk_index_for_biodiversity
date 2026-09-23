# 0006. Read map and stats data from the CDN

- **Status**: accepted
- **Date**: 2026-09-23

## Context

The client bundled `mpas.pmtiles` (48 MB), `mpas_stats.parquet` and the
two climate-risk COGs as hashed assets, which made every build and
deploy carry ~54 MB and forced the Node server to answer byte ranges
(ADR 0004). The data team now publishes these files to a public S3
bucket behind CloudFront (`https://d2g59ujvhm7q3s.cloudfront.net/data/`).
The CDN answers ranges with `206` and sends `Access-Control-Allow-Origin: *`
with all headers exposed, but rejects CORS preflight (`OPTIONS` → 403).

## Decision

The client reads the four files from the CDN through absolute URLs
defined in `client/src/lib/data-urls.ts`. `mpas_bbox.parquet` stays
bundled, and `build_mpas_bbox.py` builds it from the hosted archive.

## Alternatives considered

- **Base URL from a build-time env var** — one bucket serves every
  environment, so a variable would add a Dockerfile ARG, a Railway
  variable and a CI secret without a second value to put in them.
- **Host `mpas_bbox.parquet` in the bucket too, or add bbox columns to
  the stats extract** — the better end state because it removes the
  drift risk below, but it needs the data team. Deferred.

## Consequences

- **Positive**: builds and deploys lose ~54 MB. The large files no
  longer depend on the app server's range support.
- **Trade-offs**: every reader must stay on CORS simple requests (a
  single `bytes=a-b` or `bytes=a-` range, no conditional or custom
  headers) until the bucket allows preflight. File names are not
  versioned and the CDN caches for 5 min (browser) / 24 h (edge), so a
  data refresh can briefly serve a new archive with old stats, or swap
  a file mid-session (the geotiff reader then fails with an ETag
  conflict). The bundled bbox must be regenerated on every archive
  refresh, because a stale one flies to the wrong areas without failing.
- **Follow-ups**: versioned paths per extract (`data/<extract>/…`) with
  immutable caching. Move bbox into the extract. Allow `OPTIONS` on the
  distribution for headroom.
