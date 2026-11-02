import { useQuery } from "@tanstack/react-query";
import { fetchSarStatus } from "@/lib/species-sar-status";

export function useSpeciesSarStatus(speciesId: number) {
  return useQuery({
    queryKey: ["species-sar-status", speciesId],
    queryFn: () => fetchSarStatus(speciesId),
    staleTime: Infinity,
  });
}
