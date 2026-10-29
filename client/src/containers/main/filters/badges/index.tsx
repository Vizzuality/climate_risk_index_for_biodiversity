import { CircleXIcon } from "lucide-react";

import { AREA_SIZES } from "@/lib/area-sizes";
import { BIOREGIONS } from "@/lib/bioregions";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import {
  AREA_FILTER_KEYS,
  type AreaFilterKey,
  type AreaFilters,
  useAreaFilters,
} from "@/containers/main/store";

type FilterOption = Readonly<{ value: string; label: string }>;

const FILTER_OPTIONS: Record<AreaFilterKey, readonly FilterOption[]> = {
  protection: PROTECTION_TYPES.map(({ value, shortLabel }) => ({ value, label: shortLabel })),
  region: BIOREGIONS,
  size: AREA_SIZES,
};

const selectedValues = (filters: AreaFilters, key: AreaFilterKey) =>
  filters[key] as readonly string[];

export function FilterBadges() {
  const [filters, applyFilters] = useAreaFilters();

  const badges = AREA_FILTER_KEYS.flatMap((key) =>
    FILTER_OPTIONS[key]
      .filter((option) => selectedValues(filters, key).includes(option.value))
      .map((option) => ({ key, ...option })),
  );

  if (!badges.length) return null;

  const remove = (key: AreaFilterKey, value: string) =>
    applyFilters({
      ...filters,
      [key]: selectedValues(filters, key).filter((selected) => selected !== value),
    } as AreaFilters);

  return (
    <ul aria-label="Applied filters" className="flex flex-wrap gap-2">
      {badges.map(({ key, value, label }) => (
        <li key={`${key}-${value}`}>
          <button
            type="button"
            aria-label={`Remove ${label} filter`}
            onClick={() => remove(key, value)}
            className="flex cursor-pointer items-center gap-2 rounded-3xl bg-teal-200 px-2.5 py-1 text-xs leading-4 text-teal-950 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {label}
            <CircleXIcon aria-hidden className="size-3 text-slate-700" strokeWidth={2.4} />
          </button>
        </li>
      ))}
    </ul>
  );
}
