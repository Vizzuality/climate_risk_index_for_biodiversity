import { useMemo } from "react";

import { useSpecies } from "@/hooks/use-species";
import { type Species, speciesName } from "@/lib/species";
import { useScenario } from "@/store";

const SUGGESTED_SPECIES_COUNT = 10;

const toOption = (species: Species) => ({
  value: String(species.id),
  label: speciesName(species),
  description: species.common_name ? species.scientific_name : undefined,
});

// Every species by name, and as suggestions the ones with a common name at the highest climate
// risk under the selected scenario.
export function useSpeciesOptions() {
  const { data } = useSpecies();
  const [scenario] = useScenario();

  const options = useMemo(
    () => (data ?? []).map(toOption).sort((a, b) => a.label.localeCompare(b.label)),
    [data],
  );

  const suggested = useMemo(() => {
    const risk = (species: Species) => species.climate_risk[scenario].mean ?? 0;
    return (data ?? [])
      .filter((species) => species.common_name && species.climate_risk[scenario].mean !== null)
      .sort((a, b) => risk(b) - risk(a))
      .slice(0, SUGGESTED_SPECIES_COUNT)
      .map(toOption);
  }, [data, scenario]);

  return { options, suggested };
}
