import { Area } from "@/containers/main/table/columns";
import { AREA_FILTER_DEFAULTS, AREA_FILTER_KEYS, type AreaFilters } from "@/containers/main/store";

export function filterByAreaName(areas: Area[], searchTerm: string): Area[] {
  if (!searchTerm) return areas;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return areas.filter((area) => area.name.toLowerCase().includes(lowerCaseSearchTerm));
}

type AreaFilterPredicates = {
  [K in keyof AreaFilters]: (area: Area, value: AreaFilters[K]) => boolean;
};

const AREA_FILTER_PREDICATES: AreaFilterPredicates = {};

const isFilterActive = (filters: AreaFilters, key: keyof AreaFilters) =>
  JSON.stringify(filters[key]) !== JSON.stringify(AREA_FILTER_DEFAULTS[key]);

export const hasActiveAreaFilters = (filters: AreaFilters) =>
  AREA_FILTER_KEYS.some((key) => isFilterActive(filters, key));

export function filterAreas(areas: Area[], filters: AreaFilters): Area[] {
  const active = AREA_FILTER_KEYS.filter((key) => isFilterActive(filters, key));
  if (!active.length) return areas;

  return areas.filter((area) =>
    active.every((key) => {
      const matches = AREA_FILTER_PREDICATES[key] as (area: Area, value: unknown) => boolean;
      return matches(area, filters[key]);
    }),
  );
}
