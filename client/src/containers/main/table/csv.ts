import type { Area, IndicatorStats } from "@/containers/main/table/columns";
import type { CsvColumn } from "@/lib/csv";
import type { SCENARIO } from "@/types";

const SCENARIO_LABELS: Record<SCENARIO, string> = {
  low: "low_emissions",
  high: "high_emissions",
};

const STATS: (keyof IndicatorStats)[] = ["min", "mean", "max"];

const climVulnStat = (area: Area, scenario: SCENARIO, stat: keyof IndicatorStats) =>
  area.indicator.find((indicator) => indicator.name === "ClimVuln")?.scenario[scenario][stat];

export const AREA_CSV_COLUMNS: CsvColumn<Area>[] = [
  { header: "id", value: (area) => area.id },
  { header: "name", value: (area) => area.name },
  ...(["low", "high"] as const).flatMap((scenario) =>
    STATS.map((stat): CsvColumn<Area> => ({
      header: `climate_risk_${SCENARIO_LABELS[scenario]}_${stat}`,
      value: (area) => climVulnStat(area, scenario, stat),
    })),
  ),
  { header: "assessed_species", value: (area) => area.assessed_species },
];

export const areasCsvFilename = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `crib-conservation-areas-${day}-${time}.csv`;
};
