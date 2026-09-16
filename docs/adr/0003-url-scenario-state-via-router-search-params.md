# 0003. URL scenario state via TanStack Router search params

- **Status**: accepted
- **Date**: 2026-09-16

## Context

The selected emissions scenario (`low` | `high`) lives in the query string
so views are shareable. It was managed by `nuqs` through its TanStack
Router adapter. That adapter writes the URL by navigating to the current
pathname with the new query string glued onto it as a single `to` string.
The router core only splits a query string out of `href`, never out of
`to`, so on a route with a dynamic segment (`/$area`) the glued path
matches the route with the query string swallowed into the param, and
the `retainSearchParams` middleware appends the current search on top.
The second write on a detail page produced `?scenario=high?scenario=high`,
the parsed value no longer matched either scenario, and the raster layer
failed on an undefined URL. Reported upstream as nuqs issue #1590 (open,
still present in nuqs 2.10.1 and router-core 1.171). The scenario is the
only query state in the app.

## Decision

Drop `nuqs`. The root route declares `validateSearch` for `scenario`
(anything but `high` falls back to `low`) plus `retainSearchParams` and
`stripSearchParams` middlewares, and `useScenario` in `src/store.ts` is
implemented with the router's own `useSearch` and `useNavigate`, keeping
the `[scenario, setScenario]` tuple for consumers.

## Alternatives considered

- **Custom nuqs adapter** with `unstable_createAdapterProvider` passing a
  search object instead of a glued string. Keeps nuqs for one parameter
  at the cost of ~40 lines on an unstable API, to be deleted once
  upstream fixes the adapter.
- **`pnpm patch` on the shipped adapter.** Smallest diff, but a patch to
  maintain across every nuqs bump for a bug we can avoid entirely.
- **Wait for the upstream fix.** The issue had no maintainer response,
  and the toggle is broken on every detail page meanwhile.

## Consequences

- **Positive**: one dependency fewer; the scenario is validated at the
  router boundary, so a malformed URL renders the default instead of
  feeding an invalid value to the map layers; the default is stripped
  from the URL as before.
- **Trade-offs**: adding further query state means extending the root
  `validateSearch` by hand rather than dropping in a nuqs parser.
- **Follow-ups**: none in code. Regression covered by `src/store.test.tsx`.
