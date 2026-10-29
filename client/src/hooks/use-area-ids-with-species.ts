import { useQuery } from "@tanstack/react-query";
import { fetchAreaIdsWithSpecies } from "@/lib/species-areas";

export function useAreaIdsWithSpecies(speciesIds: readonly string[]) {
  return useQuery({
    queryKey: ["area-ids-with-species", speciesIds],
    queryFn: () => fetchAreaIdsWithSpecies(speciesIds),
    enabled: speciesIds.length > 0,
    staleTime: Infinity,
  });
}
