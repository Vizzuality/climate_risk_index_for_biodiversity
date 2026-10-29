import { useMemo } from "react";

import { useAreaFilters, useListSearch } from "@/containers/main/store";
import { useAreaIdsWithSpecies } from "@/hooks/use-area-ids-with-species";
import { useAreas } from "@/hooks/use-areas";
import { filterAreas, filterByAreaName, hasActiveAreaFilters } from "@/utils/filters";

export function useFilteredAreas() {
  const [q] = useListSearch();
  const [filters] = useAreaFilters();
  const { data, isPending: areasPending } = useAreas();
  const speciesAreas = useAreaIdsWithSpecies(filters.species);
  const speciesPending = filters.species.length > 0 && speciesAreas.isPending;
  const filtered = useMemo(
    () =>
      data && !speciesPending
        ? filterAreas(filterByAreaName(data, q), filters, speciesAreas.data)
        : undefined,
    [data, q, filters, speciesPending, speciesAreas.data],
  );
  const isFiltered = q !== "" || hasActiveAreaFilters(filters);
  return { data: filtered, isPending: areasPending || speciesPending, isFiltered };
}
