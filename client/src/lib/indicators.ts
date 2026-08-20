import { SCENARIO } from "@/types";

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
