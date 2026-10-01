import { useMemo } from "react";

import { useAreaSearch } from "@/containers/main/store";
import { useAreas } from "@/hooks/use-areas";
import { filterByAreaName } from "@/utils/filters";

export function useFilteredAreas() {
  const [q] = useAreaSearch();
  const { data, isPending } = useAreas();
  const filtered = useMemo(() => (data && q ? filterByAreaName(data, q) : data), [data, q]);
  return { data: filtered, isPending, q };
}
