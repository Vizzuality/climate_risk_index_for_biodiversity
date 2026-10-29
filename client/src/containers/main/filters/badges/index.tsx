import { AREA_SIZES } from "@/lib/area-sizes";
import { BIOREGIONS } from "@/lib/bioregions";
import { DEPTH_TIERS } from "@/lib/depth-tiers";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import { FilterBadgeList } from "@/containers/main/filters/badges/list";
import { useSpeciesOptions } from "@/containers/main/filters/species-options";
import {
  AREA_FILTER_KEYS,
  type AreaFilterKey,
  type AreaFilters,
  useAreaFilters,
} from "@/containers/main/store";

type FilterOption = Readonly<{ value: string; label: string }>;

const STATIC_FILTER_OPTIONS: Record<Exclude<AreaFilterKey, "species">, readonly FilterOption[]> = {
  protection: PROTECTION_TYPES.map(({ value, shortLabel }) => ({ value, label: shortLabel })),
  region: BIOREGIONS,
  size: AREA_SIZES,
  depth: DEPTH_TIERS,
};

const selectedValues = (filters: AreaFilters, key: AreaFilterKey) =>
  filters[key] as readonly string[];

export function FilterBadges() {
  const [filters, applyFilters] = useAreaFilters();
  const { options: speciesOptions } = useSpeciesOptions();
  const filterOptions = { ...STATIC_FILTER_OPTIONS, species: speciesOptions };

  const badges = AREA_FILTER_KEYS.flatMap((key) =>
    filterOptions[key]
      .filter((option) => selectedValues(filters, key).includes(option.value))
      .map((option) => ({ key, ...option })),
  );

  const remove = (key: AreaFilterKey, value: string) =>
    applyFilters({
      ...filters,
      [key]: selectedValues(filters, key).filter((selected) => selected !== value),
    } as AreaFilters);

  return <FilterBadgeList badges={badges} onRemove={remove} />;
}
