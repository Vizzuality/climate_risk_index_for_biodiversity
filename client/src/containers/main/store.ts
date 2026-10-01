import { useMemo } from "react";
import { type SearchSchemaInput, useNavigate, useSearch } from "@tanstack/react-router";

// Each filter adds its key, default and URL parser here and its predicate in
// `AREA_FILTER_PREDICATES` (utils/filters.ts); multi-value filters are comma-separated.
export type AreaFilters = Record<never, never>;

export const AREA_FILTER_DEFAULTS: AreaFilters = {};

export const AREA_FILTER_KEYS = Object.keys(AREA_FILTER_DEFAULTS) as (keyof AreaFilters)[];

const validateAreaFilters = (_search: Record<string, unknown>): AreaFilters => ({});

type AreaListSearch = { q: string } & AreaFilters;

export const AREA_LIST_SEARCH_DEFAULTS: AreaListSearch = { q: "", ...AREA_FILTER_DEFAULTS };

export const validateAreaListSearch = (
  search: { q?: unknown } & SearchSchemaInput,
): AreaListSearch => ({
  q: typeof search.q === "string" ? search.q : AREA_LIST_SEARCH_DEFAULTS.q,
  ...validateAreaFilters(search),
});

// Non-strict so the hook works under any route tree whose list route validates `q`.
export const useAreaSearch = () => {
  const { q = AREA_LIST_SEARCH_DEFAULTS.q } = useSearch({ strict: false });
  const navigate = useNavigate();
  const setQ = (next: string) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, q: next }), replace: true });
  return [q, setQ] as const;
};

export const useAreaFilters = () => {
  const search: Partial<AreaFilters> = useSearch({ strict: false });
  const navigate = useNavigate();
  const filters = useMemo(
    () =>
      Object.fromEntries(
        AREA_FILTER_KEYS.map((key) => [key, search[key] ?? AREA_FILTER_DEFAULTS[key]]),
      ) as AreaFilters,
    [search],
  );
  const applyFilters = (next: AreaFilters) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...next }) });
  return [filters, applyFilters] as const;
};
