import { AREA_SIZES } from "@/lib/area-sizes";
import { BIOREGIONS } from "@/lib/bioregions";
import { DEPTH_TIERS } from "@/lib/depth-tiers";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import {
  CheckboxField,
  ComboboxField,
  FiltersDialog,
} from "@/containers/main/filters/modal/fields";
import { useSpeciesOptions } from "@/containers/main/filters/species-options";
import { NO_AREA_FILTERS, useAreaFilters } from "@/containers/main/store";

const MAX_SPECIES_RESULTS = 50;

export function FiltersModal() {
  const [filters, applyFilters] = useAreaFilters();
  const speciesOptions = useSpeciesOptions();

  return (
    <FiltersDialog
      filters={filters}
      onApply={applyFilters}
      cleared={NO_AREA_FILTERS}
      description="Narrow the conservation areas shown in the table and on the map."
    >
      {(draft, setDraft) => (
        <>
          <ComboboxField
            label="Governance type"
            placeholder="Select governance type"
            options={PROTECTION_TYPES}
            value={draft.protection}
            onChange={(protection) => setDraft((prev) => ({ ...prev, protection }))}
          />
          <ComboboxField
            label="Regions"
            placeholder="Select region"
            searchPlaceholder="Search region"
            options={BIOREGIONS}
            value={draft.region}
            onChange={(region) => setDraft((prev) => ({ ...prev, region }))}
          />
          <ComboboxField
            label="Species"
            placeholder="Select species"
            searchPlaceholder="Search species"
            options={speciesOptions.options}
            suggestedSearch={{
              suggested: speciesOptions.suggested,
              maxResults: MAX_SPECIES_RESULTS,
            }}
            value={draft.species}
            onChange={(species) => setDraft((prev) => ({ ...prev, species }))}
          />
          <CheckboxField
            label="Size"
            options={AREA_SIZES}
            value={draft.size}
            onChange={(size) => setDraft((prev) => ({ ...prev, size }))}
          />
          <CheckboxField
            label="Seafloor depth and topography"
            options={DEPTH_TIERS}
            value={draft.depth}
            onChange={(depth) => setDraft((prev) => ({ ...prev, depth }))}
          />
        </>
      )}
    </FiltersDialog>
  );
}
