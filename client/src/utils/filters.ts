import { Area } from "@/containers/main/table/columns";
import {
  AREA_FILTER_KEYS,
  type AreaFilterKey,
  type AreaFilters,
  isAreaFilterActive,
} from "@/containers/main/store";
import { AREA_SIZES, isInAreaSize } from "@/lib/area-sizes";
import { BIOREGIONS } from "@/lib/bioregions";
import { PROTECTION_TYPES } from "@/lib/protection-types";

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
  region: (area, values) =>
    BIOREGIONS.some(
      (bioregion) => values.includes(bioregion.value) && area.regions.includes(bioregion.region),
    ),
  species: (area, _speciesIds, speciesAreaIds) => speciesAreaIds.has(area.id),
  size: ({ area_km2 }, values) =>
    area_km2 !== null &&
    AREA_SIZES.some((size) => values.includes(size.value) && isInAreaSize(area_km2, size)),
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
