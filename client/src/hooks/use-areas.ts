import { useQuery } from "@tanstack/react-query";
import { fetchAreas } from "@/lib/areas";

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
