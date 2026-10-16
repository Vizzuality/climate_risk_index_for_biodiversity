// Class breaks for the Vulnerability indicator (tlow, tmed, thigh) as
// supplied with the rasters; the detail chart applies them to every indicator
// until per-indicator breaks are provided. The map raster takes its colors
// from the COG's color table; keep data-processing/conf/climate_risk_colors.txt
// in sync.
export const RISK_CLASSES = [
  { min: 0, color: "#45B9C7", label: "Negligible" },
  { min: 0.2345909125689, color: "#B5E2D1", label: "Moderate" },
  { min: 0.443899021417284, color: "#F1BC83", label: "High" },
  { min: 0.650018122866379, color: "#D95730", label: "Critical" },
] as const;

export function riskColorFor(value: number): string {
  let color: string = RISK_CLASSES[0].color;
  for (const cls of RISK_CLASSES) {
    if (value >= cls.min) match = cls;
  }
  return match;
}

export function riskColorFor(value: number): string {
  return riskClassFor(value).color;
}
