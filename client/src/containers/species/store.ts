import type { SearchSchemaInput } from "@tanstack/react-router";

type SpeciesListSearch = { q: string };

export const SPECIES_LIST_SEARCH_DEFAULTS: SpeciesListSearch = { q: "" };

export const validateSpeciesListSearch = (
  search: { q?: unknown } & SearchSchemaInput,
): SpeciesListSearch => ({
  q: typeof search.q === "string" ? search.q : SPECIES_LIST_SEARCH_DEFAULTS.q,
});
