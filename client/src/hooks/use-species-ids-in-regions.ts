import { useQuery } from "@tanstack/react-query";
import type { Bioregion } from "@/lib/bioregions";
import { fetchSpeciesIdsInBioregions } from "@/lib/region-species";

export function useSpeciesIdsInRegions(regions: readonly Bioregion[]) {
  return useQuery({
    queryKey: ["species-ids-in-regions", regions],
    queryFn: () => fetchSpeciesIdsInBioregions(regions),
    enabled: regions.length > 0,
    staleTime: Infinity,
  });
}
