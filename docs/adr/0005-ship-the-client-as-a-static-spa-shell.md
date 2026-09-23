# 0005. Ship the client as a static SPA shell

- **Status**: accepted (supersedes ADR 0004)
- **Date**: 2026-09-23

## Context

The client was built as a TanStack Start SSR app on Nitro's Node server,
but nothing in it uses the server: routes have no loaders or server
functions, all data is read in the browser through duckdb-wasm, and the
map only mounts on the client. The server rendered an empty page skeleton
per request. The intended home for the app is a static host (S3 behind
CloudFront), with Railway kept as the deployment target until then.

TanStack Start's SPA mode prerenders a single shell page at build time
and renders every route in the browser, which is exactly what a static
host needs. Its prerender step boots Start's own server bundle through
Vite's preview server, and the Nitro v2 Vite plugin never writes that
bundle, so the two cannot be combined (TanStack/router issue 5426).
Nitro 3 is still in beta.

## Decision

Enable `spa: { enabled: true }` and drop the Nitro plugin. `vite build`
now produces `dist/client` (hashed assets, data files and `_shell.html`)
and a build-time-only `dist/server`. For Railway and Docker Compose,
`static-server.ts` (bundled to `dist/server.mjs` by esbuild) serves
`dist/client` with `serve-static`: byte ranges, immutable cache headers
for `assets/` and `duckdb-extensions/`, `_shell.html` for any
extensionless path, and a real 404 for missing files. That is the same
contract a CloudFront distribution will implement, so Railway stays a
faithful rehearsal for the static deployment.

## Alternatives considered

- **Nitro 3 (`nitro/vite`).** Works with SPA mode according to the
  upstream issue, but it is a beta release and would keep a server
  runtime the app does not need.
- **`ssr: false` on the root route, keep Nitro.** Makes every response a
  shell without producing a static artifact, so it does not advance the
  static-hosting goal and keeps the Range workaround from ADR 0004.
- **Keep SSR until the S3 move.** Defers finding out whether anything
  depends on server rendering to the moment hosting changes.

## Consequences

- **Positive**: the deployable is a folder of files; the Range handler,
  `h3` and Nitro are gone; local `pnpm start` and Railway run the exact
  server behaviour a CDN will provide; the Docker image shrinks to the
  built files plus one bundled script.
- **Trade-offs**: no server-rendered HTML per area (it was a skeleton
  anyway); the build adds an esbuild step for the server script;
  `pnpm dev` still runs Start's dev server, so dev and production differ
  in how a page is first served.
- **Follow-ups**: move hosting to S3 + CloudFront (extensionless paths
  rewritten to `_shell.html`, cache headers set as object metadata);
  then retire the Railway service and `static-server.ts`.
