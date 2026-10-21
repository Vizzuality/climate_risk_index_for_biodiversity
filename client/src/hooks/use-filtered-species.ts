import { useMemo } from "react";

import { useListSearch } from "@/containers/main/store";
import { useSpecies } from "@/hooks/use-species";
import { filterSpecies } from "@/lib/area-species";

export function useFilteredSpecies() {
  const [q] = useListSearch();
  const { data, isPending } = useSpecies();
  const filtered = useMemo(() => data && filterSpecies(data, q), [data, q]);
  return { data: filtered, isPending };
}
