// Class breaks for the Vulnerability indicator (tlow, tmed, thigh) as
// supplied with the rasters; the detail chart applies them to every indicator
// until per-indicator breaks are provided. The map raster takes its colors
// from the COG's color table; keep data-processing/conf/climate_risk_colors.txt
// in sync. Badges carry white labels, so they take a darker `badgeColor`.
export const RISK_CLASSES = [
  { value: "negligible", min: 0, color: "#45B9C7", badgeColor: "#36B2C1", label: "Negligible" },
  {
    value: "moderate",
    min: 0.2345909125689,
    color: "#B5E2D1",
    badgeColor: "#4DC195",
    label: "Moderate",
  },
  { value: "high", min: 0.443899021417284, color: "#F1BC83", badgeColor: "#F4942B", label: "High" },
  {
    value: "critical",
    min: 0.650018122866379,
    color: "#D95730",
    badgeColor: "#D95730",
    label: "Critical",
  },
] as const;

export type RiskClass = (typeof RISK_CLASSES)[number];

export const RISK_CLASS_VALUES = RISK_CLASSES.map((cls) => cls.value);

export function riskClassFor(value: number): RiskClass {
  let match: RiskClass = RISK_CLASSES[0];
  for (const cls of RISK_CLASSES) {
    if (value >= cls.min) match = cls;
  }
  return match;
}

export function riskColorFor(value: number): string {
  return riskClassFor(value).color;
}
