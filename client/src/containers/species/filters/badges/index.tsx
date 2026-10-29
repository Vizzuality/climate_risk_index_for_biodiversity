import { FilterBadgeList } from "@/containers/main/filters/badges/list";
import {
  SPECIES_FILTER_KEYS,
  type SpeciesFilterKey,
  type SpeciesFilters,
  useSpeciesFilters,
} from "@/containers/species/store";
import { BIOREGIONS } from "@/lib/bioregions";
import { RISK_CLASSES } from "@/lib/risk-colormap";

type FilterOption = Readonly<{ value: string; label: string }>;

const FILTER_OPTIONS: Record<SpeciesFilterKey, readonly FilterOption[]> = {
  region: BIOREGIONS,
  risk: RISK_CLASSES,
};

const selectedValues = (filters: SpeciesFilters, key: SpeciesFilterKey) =>
  filters[key] as readonly string[];

export function SpeciesFilterBadges() {
  const [filters, applyFilters] = useSpeciesFilters();

  const badges = SPECIES_FILTER_KEYS.flatMap((key) =>
    FILTER_OPTIONS[key]
      .filter((option) => selectedValues(filters, key).includes(option.value))
      .map(({ value, label }) => ({ key, value, label })),
  );

  const remove = (key: SpeciesFilterKey, value: string) =>
    applyFilters({
      ...filters,
      [key]: selectedValues(filters, key).filter((selected) => selected !== value),
    } as SpeciesFilters);

  return <FilterBadgeList badges={badges} onRemove={remove} />;
}
