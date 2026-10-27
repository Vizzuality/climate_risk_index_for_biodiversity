import { useQuery } from "@tanstack/react-query";
import { fetchSpeciesAreas } from "@/lib/species-areas";

export function useSpeciesAreas(speciesId: number | undefined) {
  return useQuery({
    queryKey: ["species-areas", speciesId],
    queryFn: () => fetchSpeciesAreas(speciesId!),
    enabled: speciesId !== undefined,
    staleTime: Infinity,
  });
}
