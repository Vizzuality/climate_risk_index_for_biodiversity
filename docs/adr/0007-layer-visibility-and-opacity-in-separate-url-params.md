# 0007. Layer visibility and opacity in separate URL params

- **Status**: accepted
- **Date**: 2026-10-06

## Context

The map legend lets users hide a layer or change its opacity, and shared
links must reopen the map with the same settings, so both belong in the
URL next to the existing map state. `layers` already lists the contextual
layers on the map (`?layers=areas,bioregions`, missing meaning the default
set). The emissions raster is not in `layers`: it is always drawn, and its
panel switch was removed because two controls for it confused users. It
still needs visibility and opacity like any other layer.

## Decision

Add two root search params beside `layers`: `hidden`, a comma-separated
list of layer keys (`?hidden=risk,bioregions`), and `opacity`, comma-
separated `key:percent` pairs in 10% steps (`?opacity=risk:60,areas:80`).
Both are stripped at their defaults (all visible, 100%). The raster's key
is `risk`. Entries for a contextual layer that isn't in `layers` are
dropped when the URL is parsed and cleared when the layer is switched off.

## Alternatives considered

- **Per-layer tokens in `layers`** (`?layers=risk:60,areas,bioregions:h`).
  Keeps each layer's state in one place, but needs a new grammar, and the
  always-on raster would have to join `layers`, changing what that param
  and its default mean for existing links.
- **One JSON-encoded settings param** (TanStack's default for objects).
  No new codec, but unreadable and long in a shared link.

## Consequences

- **Positive**: existing links keep their meaning; each param reuses or
  mirrors an existing codec (`multiValue`, plus `percentByKey` in
  `lib/search-params.ts`); 10% steps keep URLs short and stable.
- **Trade-offs**: a layer's state is split across three params, so
  removing a layer must clear it from `hidden` and `opacity` too
  (`keepLayerSettingsOnMap` in `src/store.ts` does both on parse and on
  switch-off).
- **Follow-ups**: new map layers need a key in `MAP_LAYERS`
  (`lib/map-layers.ts`) to get legend settings.
