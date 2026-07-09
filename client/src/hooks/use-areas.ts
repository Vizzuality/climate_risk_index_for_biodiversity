import { useQuery } from "@tanstack/react-query";
import { Area } from "@/containers/main/table/columns";

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async (): Promise<Area[]> => {
      const res = await fetch("/wdpa.json");
      if (!res.ok) throw new Error(`Failed to load areas: ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
