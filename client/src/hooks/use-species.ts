import { useQuery } from "@tanstack/react-query";
import { fetchSpecies } from "@/lib/species";

export function useSpecies() {
  return useQuery({
    queryKey: ["species"],
    queryFn: fetchSpecies,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
