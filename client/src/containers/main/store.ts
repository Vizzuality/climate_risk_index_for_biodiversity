import { type SearchSchemaInput, useNavigate, useSearch } from "@tanstack/react-router";

import { BIOREGION_VALUES } from "@/lib/bioregions";
import { PROTECTION_TYPE_VALUES } from "@/lib/protection-types";
import { multiValue, type SearchCodec } from "@/lib/search-params";

// Each filter adds its codec here and its predicate in `AREA_FILTER_PREDICATES`
// (utils/filters.ts). An inactive filter serializes to "". The default selection is stripped
// from the URL, so a cleared filter that has a default stays as an empty param.
const AREA_FILTER_CODECS = {
  protection: multiValue(PROTECTION_TYPE_VALUES, ["ebsa"]),
  region: multiValue(BIOREGION_VALUES),
};

type AreaFilterCodecs = typeof AREA_FILTER_CODECS;

export type AreaFilterKey = keyof AreaFilterCodecs;

export type AreaFilters = { [K in AreaFilterKey]: ReturnType<AreaFilterCodecs[K]["parse"]> };

type AreaFiltersSearch = Record<AreaFilterKey, string>;

export const AREA_FILTER_KEYS = Object.keys(AREA_FILTER_CODECS) as AreaFilterKey[];

const codecFor = (key: AreaFilterKey) => AREA_FILTER_CODECS[key] as SearchCodec<unknown>;

const parseAreaFilters = (search: Partial<Record<AreaFilterKey, unknown>>) =>
  Object.fromEntries(
    AREA_FILTER_KEYS.map((key) => [key, codecFor(key).parse(search[key])]),
  ) as AreaFilters;

const serializeAreaFilters = (filters: AreaFilters) =>
  Object.fromEntries(
    AREA_FILTER_KEYS.map((key) => [key, codecFor(key).serialize(filters[key])]),
  ) as AreaFiltersSearch;

export const AREA_FILTER_DEFAULTS = parseAreaFilters({});

export const NO_AREA_FILTERS = parseAreaFilters(
  Object.fromEntries(AREA_FILTER_KEYS.map((key) => [key, ""])),
);

export const isAreaFilterActive = (filters: AreaFilters, key: AreaFilterKey) =>
  codecFor(key).serialize(filters[key]) !== "";

type AreaListSearch = { q: string } & AreaFiltersSearch;

export const AREA_LIST_SEARCH_DEFAULTS: AreaListSearch = {
  q: "",
  ...serializeAreaFilters(AREA_FILTER_DEFAULTS),
};

export const validateAreaListSearch = (
  search: { q?: unknown } & Partial<Record<AreaFilterKey, unknown>> & SearchSchemaInput,
): AreaListSearch => ({
  q: typeof search.q === "string" ? search.q : AREA_LIST_SEARCH_DEFAULTS.q,
  ...serializeAreaFilters(parseAreaFilters(search)),
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
  // Structural sharing keeps `filters` the same object while other params (scenario, layers)
  // change; the matches and the map's fitted box are derived from its identity.
  const filters = useSearch({
    strict: false,
    select: (search: Partial<AreaFiltersSearch>) => parseAreaFilters(search),
    structuralSharing: true,
  });
  const navigate = useNavigate();
  const applyFilters = (next: AreaFilters) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...serializeAreaFilters(next) }) });
  return [filters, applyFilters] as const;
};
