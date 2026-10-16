import { useQuery } from "@tanstack/react-query";
import { fetchAreaSpecies } from "@/lib/area-species";

export function useAreaSpecies(areaId: string | undefined) {
  return useQuery({
    queryKey: ["area-species", areaId],
    queryFn: () => fetchAreaSpecies(areaId!),
    enabled: !!areaId,
    staleTime: Infinity,
  });
}
