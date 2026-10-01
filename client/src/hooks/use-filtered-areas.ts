import { useMemo } from "react";

import { useAreaFilters, useAreaSearch } from "@/containers/main/store";
import { useAreas } from "@/hooks/use-areas";
import { filterAreas, filterByAreaName, hasActiveAreaFilters } from "@/utils/filters";

export function useFilteredAreas() {
  const [q] = useAreaSearch();
  const [filters] = useAreaFilters();
  const { data, isPending } = useAreas();
  const filtered = useMemo(
    () => data && filterAreas(filterByAreaName(data, q), filters),
    [data, q, filters],
  );
  const isFiltered = q !== "" || hasActiveAreaFilters(filters);
  return { data: filtered, isPending, isFiltered };
}
