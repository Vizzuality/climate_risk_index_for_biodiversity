import type { Area, IndicatorStats } from "@/containers/main/table/columns";
import type { SCENARIO } from "@/types";

export const EXPERIMENT_TO_SCENARIO: Record<number, SCENARIO> = {
  126: "low", // SSP1-2.6
  585: "high", // SSP5-8.5
};

// Column names in mpas_stats.parquet, also used as indicator names in the
// UI (categories-metadata.json keys must match them).
export const INDICATOR_COLUMNS = [
  "Sens.TSMr",
  "Sens.RLstatus",
  "Sens.HII",
  "Sens.vind",
  "Adapt.hfrag",
  "Adapt.lmax",
  "Adapt.hrange",
  "Adapt.tvar",
  "Expo.toe",
  "Expo.vel",
  "Expo.plost",
  "Expo.nrchng",
  "ClimSens",
  "ClimAdapt",
  "ClimExpo",
  "ClimVuln",
  "ClimSensSD",
  "ClimAdaptSD",
  "ClimExpoSD",
  "ClimVulnSD",
] as const;

type IndicatorColumn = (typeof INDICATOR_COLUMNS)[number];

// A row of mpas_stats.parquet or species_stats.parquet: the mean of every
// indicator, plus the ClimVuln range.
export type IndicatorRow = Record<IndicatorColumn, number | null> & {
  ClimVuln_min: number | null;
  ClimVuln_max: number | null;
};

function scenarioStats(row: IndicatorRow, name: IndicatorColumn): IndicatorStats {
  const mean = row[name];
  return {
    min: name === "ClimVuln" ? row.ClimVuln_min : mean,
    mean,
    max: name === "ClimVuln" ? row.ClimVuln_max : mean,
  };
}

export const buildIndicators = (low: IndicatorRow, high: IndicatorRow): Area["indicator"] =>
  INDICATOR_COLUMNS.map((name) => ({
    name,
    type: "numerical" as const,
    scenario: { low: scenarioStats(low, name), high: scenarioStats(high, name) },
  }));
