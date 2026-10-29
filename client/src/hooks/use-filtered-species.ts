import { useMemo } from "react";

import { useListSearch } from "@/containers/main/store";
import { useSpeciesFilters } from "@/containers/species/store";
import { useSpecies } from "@/hooks/use-species";
import { useSpeciesIdsInRegions } from "@/hooks/use-species-ids-in-regions";
import { filterSpecies } from "@/lib/area-species";
import { useScenario } from "@/store";
import { filterSpeciesList } from "@/utils/filters";

const NO_SPECIES_IDS: ReadonlySet<number> = new Set();

export function useFilteredSpecies() {
  const [q] = useListSearch();
  const [filters] = useSpeciesFilters();
  const [scenario] = useScenario();
  const { data, isPending: speciesPending } = useSpecies();
  const regionSpecies = useSpeciesIdsInRegions(filters.region);
  const regionPending = filters.region.length > 0 && regionSpecies.isPending;
  const regionSpeciesIds = regionSpecies.data ?? NO_SPECIES_IDS;
  const filtered = useMemo(
    () =>
      data && !regionPending
        ? filterSpeciesList(filterSpecies(data, q), filters, { scenario, regionSpeciesIds })
        : undefined,
    [data, q, filters, scenario, regionPending, regionSpeciesIds],
  );
  return { data: filtered, isPending: speciesPending || regionPending };
}
