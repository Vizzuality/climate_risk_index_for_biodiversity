import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

import { fetchSpeciesDetail } from "@/lib/species";

export function useSelectedSpecies() {
  const { speciesId } = useParams({ strict: false });
  const id = Number(speciesId);

  return useQuery({
    queryKey: ["species", id],
    queryFn: () => fetchSpeciesDetail(id),
    enabled: Number.isInteger(id),
    staleTime: Infinity,
  });
}
