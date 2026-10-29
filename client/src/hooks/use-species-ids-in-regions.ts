import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAreas } from "@/hooks/use-areas";
import { type Bioregion, isInBioregions } from "@/lib/bioregions";
import { fetchSpeciesIdsInAreas } from "@/lib/region-species";

// The species found in any conservation area of the regions.
export function useSpeciesIdsInRegions(regions: readonly Bioregion[]) {
  const { data: areas } = useAreas();
  const areaIds = useMemo(
    () => areas?.filter((area) => isInBioregions(area.regions, regions)).map((area) => area.id),
    [areas, regions],
  );
  return useQuery({
    queryKey: ["species-ids-in-regions", regions],
    queryFn: () => fetchSpeciesIdsInAreas(areaIds ?? []),
    enabled: regions.length > 0 && areaIds !== undefined,
    staleTime: Infinity,
  });
}
