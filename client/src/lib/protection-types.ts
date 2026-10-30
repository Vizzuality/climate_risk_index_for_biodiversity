// `shortLabel` is for tight spaces like the map legend.
export const PROTECTION_TYPES = [
  {
    value: "aoi",
    governanceType: "AOI",
    label: "Area of Interest",
    shortLabel: "Area of Interest",
    color: "#fff",
    fillColor: "rgba(255, 255, 255, 0.30)",
  },
  {
    value: "ebsa",
    governanceType: "EBSA",
    label: "Ecologically and Biologically Significant Area",
    shortLabel: "EBSA",
    color: "#AF1B9E",
    fillColor: "rgba(175, 27, 158, 0.30)",
  },
  {
    value: "mca",
    governanceType: "MCA",
    label: "Marine Conserved Area",
    shortLabel: "Marine Conserved Area",
    color: "#2751DB",
    fillColor: "rgba(39, 81, 219, 0.30)",
  },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
