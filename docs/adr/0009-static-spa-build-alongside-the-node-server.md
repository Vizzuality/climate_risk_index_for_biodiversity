# 0009. Static SPA build alongside the Node server

- **Status**: accepted
- **Date**: 2026-11-03

## Context

The client has to be hosted from an S3 bucket behind CloudFront, which can
only serve files. Releases are rare and manual, so a build command is
enough; no pipeline is needed. The Railway deployment (and the Docker image it
builds) must keep working unchanged.

TanStack Start's SPA mode prerenders the root route into `_shell.html` and
leaves every other route to the browser. Its prerender step imports the
server bundle from `dist/server/`, which the Nitro v2 plugin never writes (it
keeps that bundle in memory for Nitro), so SPA mode and Nitro cannot share a
build.

## Decision

`pnpm build:spa` sets `SPA=true`, which enables SPA mode and drops the Nitro
plugin from `vite.config.ts`; the static site lands in `dist/client/`. The
default `pnpm build` is untouched and still produces the Nitro server in
`.output/` for Railway and Docker.

## Alternatives considered

- **SPA mode for every target, Railway served by Caddy** — one build, but it
  rewrites the Dockerfile and removes server rendering from a deployment that
  works today, for a host that only needs to keep running.
- **SPA mode for every target, Nitro kept** — not possible with the current
  Nitro v2 plugin, for the reason above.

## Consequences

- **Positive**: no change to the Railway or Docker deploys; the static build
  is one command.
- **Trade-offs**: two build modes. Code that only works with server rendering
  (or only without it) can pass on Railway and fail in the static build, so
  each S3 release should be checked by loading a deep link first. Cache headers
  for the static host live in the README's upload commands, not in
  `vite.config.ts`'s `routeRules`, which only Nitro reads.
- **Follow-ups**: none.
