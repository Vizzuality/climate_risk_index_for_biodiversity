import { Area } from "@/containers/main/table/columns";
import {
  AREA_FILTER_KEYS,
  type AreaFilterKey,
  type AreaFilters,
  isAreaFilterActive,
} from "@/containers/main/store";
import { PROTECTION_TYPES } from "@/lib/protection-types";

export function filterByAreaName(areas: Area[], searchTerm: string): Area[] {
  if (!searchTerm) return areas;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return areas.filter((area) => area.name.toLowerCase().includes(lowerCaseSearchTerm));
}

type AreaFilterPredicates = {
  [K in AreaFilterKey]: (area: Area, value: AreaFilters[K]) => boolean;
};

const AREA_FILTER_PREDICATES: AreaFilterPredicates = {
  protection: (area, values) =>
    PROTECTION_TYPES.some(
      (type) => type.layerType === area.layer_type && values.includes(type.value),
    ),
};

export const hasActiveAreaFilters = (filters: AreaFilters) =>
  AREA_FILTER_KEYS.some((key) => isAreaFilterActive(filters, key));

export function filterAreas(areas: Area[], filters: AreaFilters): Area[] {
  const active = AREA_FILTER_KEYS.filter((key) => isAreaFilterActive(filters, key));
  if (!active.length) return areas;

  return areas.filter((area) =>
    active.every((key) => {
      const matches = AREA_FILTER_PREDICATES[key] as (area: Area, value: unknown) => boolean;
      return matches(area, filters[key]);
    }),
  );
}
