import type { Area, IndicatorStats } from "@/containers/main/table/columns";
import { type CsvColumn, csvFilename } from "@/lib/csv";
import type { SCENARIO } from "@/types";

const SCENARIO_LABELS: Record<SCENARIO, string> = {
  low: "low_emissions",
  high: "high_emissions",
};

const STATS: (keyof IndicatorStats)[] = ["min", "mean", "max"];

// The min, mean and max climate risk of each scenario.
export const climateRiskCsvColumns = <T>(
  statsFor: (row: T, scenario: SCENARIO) => IndicatorStats | undefined,
): CsvColumn<T>[] =>
  (["low", "high"] as const).flatMap((scenario) =>
    STATS.map((stat) => ({
      header: `climate_risk_${SCENARIO_LABELS[scenario]}_${stat}`,
      value: (row: T) => statsFor(row, scenario)?.[stat],
    })),
  );

export const AREA_CSV_COLUMNS: CsvColumn<Area>[] = [
  { header: "id", value: (area) => area.id },
  { header: "name", value: (area) => area.name },
  ...climateRiskCsvColumns<Area>(
    (area, scenario) =>
      area.indicator.find((indicator) => indicator.name === "ClimVuln")?.scenario[scenario],
  ),
  { header: "assessed_species", value: (area) => area.assessed_species },
];

export const areasCsvFilename = (date: Date) => csvFilename("conservation-areas", date);
