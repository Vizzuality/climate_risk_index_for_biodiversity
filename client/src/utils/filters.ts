import { Area } from "@/containers/main/table/columns";
import {
  AREA_FILTER_KEYS,
  type AreaFilterKey,
  type AreaFilters,
  isAreaFilterActive,
} from "@/containers/main/store";
import {
  isSpeciesFilterActive,
  SPECIES_FILTER_KEYS,
  type SpeciesFilterKey,
  type SpeciesFilters,
} from "@/containers/species/store";
import { AREA_SIZES, isInAreaSize } from "@/lib/area-sizes";
import { isInBioregions } from "@/lib/bioregions";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import { riskClassFor } from "@/lib/risk-colormap";
import type { Species } from "@/lib/species";
import type { SCENARIO } from "@/types";

export function filterByAreaName(areas: Area[], searchTerm: string): Area[] {
  if (!searchTerm) return areas;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return areas.filter((area) => area.name.toLowerCase().includes(lowerCaseSearchTerm));
}

type AreaFilterPredicates = {
  [K in AreaFilterKey]: (
    area: Area,
    value: AreaFilters[K],
    speciesAreaIds: ReadonlySet<string>,
  ) => boolean;
};

const AREA_FILTER_PREDICATES: AreaFilterPredicates = {
  protection: (area, values) =>
    PROTECTION_TYPES.some(
      (type) => type.governanceType === area.governance_type && values.includes(type.value),
    ),
  region: (area, values) => isInBioregions(area.regions, values),
  species: (area, _speciesIds, speciesAreaIds) => speciesAreaIds.has(area.id),
  size: ({ area_km2 }, values) =>
    area_km2 !== null &&
    AREA_SIZES.some((size) => values.includes(size.value) && isInAreaSize(area_km2, size)),
  depth: ({ depth_tiers }, values) => depth_tiers.some((tier) => values.includes(tier)),
};

export const hasActiveAreaFilters = (filters: AreaFilters) =>
  AREA_FILTER_KEYS.some((key) => isAreaFilterActive(filters, key));

// `speciesAreaIds` holds the areas where any of the selected species occurs.
export function filterAreas(
  areas: Area[],
  filters: AreaFilters,
  speciesAreaIds: ReadonlySet<string> = new Set(),
): Area[] {
  const active = AREA_FILTER_KEYS.filter((key) => isAreaFilterActive(filters, key));
  if (!active.length) return areas;

  return areas.filter((area) =>
    active.every((key) => {
      const matches = AREA_FILTER_PREDICATES[key] as (
        area: Area,
        value: unknown,
        speciesAreaIds: ReadonlySet<string>,
      ) => boolean;
      return matches(area, filters[key], speciesAreaIds);
    }),
  );
}

// `regionSpeciesIds` holds the species whose range overlaps any of the selected regions.
type SpeciesFilterContext = Readonly<{
  scenario: SCENARIO;
  regionSpeciesIds: ReadonlySet<number>;
}>;

type SpeciesFilterPredicates = {
  [K in SpeciesFilterKey]: (
    species: Species,
    value: SpeciesFilters[K],
    context: SpeciesFilterContext,
  ) => boolean;
};

const SPECIES_FILTER_PREDICATES: SpeciesFilterPredicates = {
  region: (species, _regions, { regionSpeciesIds }) => regionSpeciesIds.has(species.id),
  risk: (species, values, { scenario }) => {
    const { mean } = species.climate_risk[scenario];
    return mean !== null && values.includes(riskClassFor(mean).value);
  },
};

// Risk-based filters match the selected scenario's risk, like the table shows.
export function filterSpeciesList(
  species: Species[],
  filters: SpeciesFilters,
  context: SpeciesFilterContext,
): Species[] {
  const active = SPECIES_FILTER_KEYS.filter((key) => isSpeciesFilterActive(filters, key));
  if (!active.length) return species;

  return species.filter((s) =>
    active.every((key) => {
      const matches = SPECIES_FILTER_PREDICATES[key] as (
        species: Species,
        value: unknown,
        context: SpeciesFilterContext,
      ) => boolean;
      return matches(s, filters[key], context);
    }),
  );
}
