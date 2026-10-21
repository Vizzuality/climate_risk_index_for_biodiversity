import { climateRiskCsvColumns } from "@/containers/main/table/csv";
import { type CsvColumn, csvFilename } from "@/lib/csv";
import type { Species } from "@/lib/species";

export const SPECIES_CSV_COLUMNS: CsvColumn<Species>[] = [
  { header: "species_id", value: (species) => species.id },
  { header: "common_name", value: (species) => species.common_name },
  { header: "scientific_name", value: (species) => species.scientific_name },
  ...climateRiskCsvColumns<Species>((species, scenario) => species.climate_risk[scenario]),
];

export const speciesCsvFilename = (date: Date) => csvFilename("species", date);
