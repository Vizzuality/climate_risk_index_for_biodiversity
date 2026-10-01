# 0007. List view state in route-scoped search params

- **Status**: accepted
- **Date**: 2026-10-01

## Context

The conservation-areas table must be shareable in the state the user left
it in, starting with the name search, which lived in a jotai atom. ADR
0003 put the emissions scenario in the URL on the root route, with
`retainSearchParams(true)` carrying the whole query string across every
navigation. The search is a different kind of state: it only means
something on the list view. With the root retaining everything, `?q=` would
follow the user onto area detail URLs and back through every `/areas` link,
so a shared detail link would carry an unrelated list filter.

## Decision

List view state is declared on the list route (`/_dashboard/areas/`), not
the root: the search is `q`, validated by `validateAreaListSearch` and
stripped when empty, read and written through `useAreaSearch` in
`containers/main/store.ts`. The root now retains only the keys it owns
(`retainSearchParams(["scenario"])`), so route-scoped params drop on
navigation away. Writes use `replace` so typing does not add history
entries; the input keeps local state and debounces the URL write.

## Alternatives considered

- **Declare `q` on the root** next to `scenario`. One schema, but `q` leaks
  onto every route and must be stripped by hand wherever it doesn't apply.
- **Keep `q` across a detail visit** (remember the last value and restore
  it on the way back). Nicer return trip, but it makes the plain `/areas`
  link stateful; browser Back already restores the search.

## Consequences

- **Positive**: `/areas?q=…` is shareable; detail URLs stay clean; further
  list state (sorting, filters) has a place to go.
- **Trade-offs**: in-app links back to `/areas` reset the search; any new
  global param must be added to the root's retain list explicitly.
- **Follow-ups**: move table sorting into the same route schema. Regression
  covered by `src/containers/main/table/index.test.tsx`.
