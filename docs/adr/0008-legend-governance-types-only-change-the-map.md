# 0008. Legend governance types only change the map

- **Status**: accepted
- **Date**: 2026-10-30

## Context

The Conservation areas legend lists the three governance types (AOI,
EBSA, MCA). Its rows used to toggle the area list's governance type
filter (`protection`), so the map and the table changed together. That
filter treats an empty selection as "no filter", the same as the filters
modal, so unchecking every row in the legend still showed every area
on the map, with every box unchecked. The URL can't tell "unchecked in
the legend" from "cleared in the modal", so any fix in the shared filter
changes the modal, the filter badges and the table too.

## Decision

The legend rows only show or hide governance types on the map, stored
in their own root search param, `hiddenTypes` (`?hiddenTypes=aoi,ebsa`,
stripped when empty). The area filters, and so the table, don't read it.
Row counts show how many areas of each type match the current filters.

## Alternatives considered

- **Empty filter means no areas.** Unchecking every row empties the map,
  but clearing the modal or removing the last badge also empties the
  table while no filter looks applied.
- **Keep the last type checked.** The legend reads an empty filter as all
  types on and won't let the last row be unchecked. Consistent, but a
  checkbox that refuses to uncheck felt broken.
- **A `none` value for the filter.** Meets the original ask, but adds a
  third filter state the modal and badges can't express.

## Consequences

- **Positive**: every row can be unchecked, and the map follows; the
  table's filter keeps one meaning everywhere; the legend works on every
  page, not just the area list.
- **Trade-offs**: types can be narrowed in two places, the filters (map
  and table) and the legend (map only), so a type the filters exclude
  shows a count of 0 and checking it adds nothing to the map.
- **Follow-ups**: `hiddenTypes` is cleared with the areas layer, like
  `hidden` and `opacity` (ADR 0007).
