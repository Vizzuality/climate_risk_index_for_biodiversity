import { type SearchSchemaInput, useNavigate, useSearch } from "@tanstack/react-router";

import { BIOREGION_VALUES } from "@/lib/bioregions";
import { RISK_CLASS_VALUES } from "@/lib/risk-colormap";
import { multiValue, type SearchCodec } from "@/lib/search-params";

// Like the area filters in containers/main/store.ts: each filter adds its codec here and its
// predicate in `SPECIES_FILTER_PREDICATES` (utils/filters.ts). An inactive filter serializes to "".
const SPECIES_FILTER_CODECS = {
  region: multiValue(BIOREGION_VALUES),
  risk: multiValue(RISK_CLASS_VALUES),
};

type SpeciesFilterCodecs = typeof SPECIES_FILTER_CODECS;

export type SpeciesFilterKey = keyof SpeciesFilterCodecs;

export type SpeciesFilters = {
  [K in SpeciesFilterKey]: ReturnType<SpeciesFilterCodecs[K]["parse"]>;
};

type SpeciesFiltersSearch = Record<SpeciesFilterKey, string>;

export const SPECIES_FILTER_KEYS = Object.keys(SPECIES_FILTER_CODECS) as SpeciesFilterKey[];

const codecFor = (key: SpeciesFilterKey) => SPECIES_FILTER_CODECS[key] as SearchCodec<unknown>;

const parseSpeciesFilters = (search: Partial<Record<SpeciesFilterKey, unknown>>) =>
  Object.fromEntries(
    SPECIES_FILTER_KEYS.map((key) => [key, codecFor(key).parse(search[key])]),
  ) as SpeciesFilters;

const serializeSpeciesFilters = (filters: SpeciesFilters) =>
  Object.fromEntries(
    SPECIES_FILTER_KEYS.map((key) => [key, codecFor(key).serialize(filters[key])]),
  ) as SpeciesFiltersSearch;

export const NO_SPECIES_FILTERS = parseSpeciesFilters(
  Object.fromEntries(SPECIES_FILTER_KEYS.map((key) => [key, ""])),
);

export const isSpeciesFilterActive = (filters: SpeciesFilters, key: SpeciesFilterKey) =>
  codecFor(key).serialize(filters[key]) !== "";

type SpeciesListSearch = { q: string } & SpeciesFiltersSearch;

export const SPECIES_LIST_SEARCH_DEFAULTS: SpeciesListSearch = {
  q: "",
  ...serializeSpeciesFilters(parseSpeciesFilters({})),
};

export const validateSpeciesListSearch = (
  search: { q?: unknown } & Partial<Record<SpeciesFilterKey, unknown>> & SearchSchemaInput,
): SpeciesListSearch => ({
  q: typeof search.q === "string" ? search.q : SPECIES_LIST_SEARCH_DEFAULTS.q,
  ...serializeSpeciesFilters(parseSpeciesFilters(search)),
});

export const useSpeciesFilters = () => {
  const filters = useSearch({
    strict: false,
    select: (search: Partial<SpeciesFiltersSearch>) => parseSpeciesFilters(search),
    structuralSharing: true,
  });
  const navigate = useNavigate();
  const applyFilters = (next: SpeciesFilters) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...serializeSpeciesFilters(next) }) });
  return [filters, applyFilters] as const;
};
