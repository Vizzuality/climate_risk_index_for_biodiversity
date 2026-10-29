import {
  CheckboxField,
  ComboboxField,
  FiltersDialog,
} from "@/containers/main/filters/modal/fields";
import { NO_SPECIES_FILTERS, useSpeciesFilters } from "@/containers/species/store";
import { BIOREGIONS } from "@/lib/bioregions";
import { RISK_CLASSES } from "@/lib/risk-colormap";

export function SpeciesFiltersModal() {
  const [filters, applyFilters] = useSpeciesFilters();

  return (
    <FiltersDialog
      filters={filters}
      onApply={applyFilters}
      cleared={NO_SPECIES_FILTERS}
      description="Narrow the species shown in the table."
    >
      {(draft, setDraft) => (
        <>
          <ComboboxField
            label="Region"
            placeholder="Select region"
            searchPlaceholder="Search region"
            options={BIOREGIONS}
            value={draft.region}
            onChange={(region) => setDraft((prev) => ({ ...prev, region }))}
          />
          <CheckboxField
            label="CRIB Index"
            options={RISK_CLASSES}
            value={draft.risk}
            onChange={(risk) => setDraft((prev) => ({ ...prev, risk }))}
          />
        </>
      )}
    </FiltersDialog>
  );
}
