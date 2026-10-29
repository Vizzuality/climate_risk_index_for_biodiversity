// Seafloor depth ranges, in metres. An area can span several, each flagged by its own column of
// the stats file.
export const DEPTH_TIERS = [
  { value: "0-100", label: "0-100m", column: "depth_0_100" },
  { value: "100-200", label: "100-200m", column: "depth_100_200" },
  { value: "200-1000", label: "200-1000m", column: "depth_200_1000" },
  { value: "gt1000", label: ">1000m", column: "depth_1000_plus" },
] as const;

export type DepthTier = (typeof DEPTH_TIERS)[number]["value"];

export type DepthTierColumn = (typeof DEPTH_TIERS)[number]["column"];

export const DEPTH_TIER_VALUES = DEPTH_TIERS.map((tier) => tier.value);
