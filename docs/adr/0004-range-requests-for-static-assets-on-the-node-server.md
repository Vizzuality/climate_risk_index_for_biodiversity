# 0004. Range requests for static assets on the Node server

- **Status**: accepted
- **Date**: 2026-09-21

## Context

The protected-areas archive (`mpas.pmtiles`, ~48 MB) and the two climate
risk COGs are bundled as hashed public assets and read in the browser
through HTTP byte-range requests: Mapbox GL's PMTiles provider and
deck.gl-geotiff fetch only the directory entries and tiles they need.
On Vercel the CDN answers those requests with `206 Partial Content`. On
the Node server that Railway (and the Docker image) run, Nitro 2.13's
built-in static handler ignores the `Range` header, reads the whole file
into memory and returns it with `200`, so the archive never opens and
neither layer renders. Nitro registers that handler ahead of every user
handler, so it cannot be intercepted; it can only be replaced.

## Decision

Disable Nitro's static handler (`serveStatic: false`) and serve
`.output/public` through a Nitro middleware backed by `serve-static`,
which supports ranges, conditional requests and `HEAD`. The handler lives
in `client/src/server/static-assets.ts` and is wired in `vite.config.ts`;
the immutable cache headers keep coming from Nitro `routeRules`, which
run before it. Vercel is unaffected: its CDN serves the assets before the
function is reached.

## Alternatives considered

- **Slice the body in Nitro's `beforeResponse` hook.** Keeps the built-in
  handler but still reads the full 48 MB per tile request before slicing.
- **Move the archive and COGs to object storage (a Railway bucket or S3).**
  Solves ranges natively and is the long-term home for data this size,
  but splits the deploy into two artifacts and adds a URL to configure
  per environment; out of scope for the prototype.
- **Enable Railway's CDN.** Its documentation does not state that it
  synthesises range responses from an origin that lacks them, so the
  origin has to support them regardless.

## Consequences

- **Positive**: PMTiles and COGs render on any Node host, not only behind
  a range-aware CDN; the server streams slices instead of buffering whole
  files.
- **Trade-offs**: two runtime dependencies (`serve-static`, already in the
  tree through Nitro, and `h3` pinned to Nitro's version) and a handler
  that must resolve `.output/public` lazily, because Nitro's rewrite of
  `import.meta.url` is only in place once the server entry has run.
- **Follow-ups**: revisit when moving to Nitro 3 / h3 2, whose static
  serving may support ranges natively.
