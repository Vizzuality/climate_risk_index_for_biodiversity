// `shortLabel` is for tight spaces like the map legend.
export const PROTECTION_TYPES = [
  {
    value: "aoi",
    governanceType: "AOI",
    label: "Area of Interest",
    shortLabel: "Area of Interest",
    color: "#d9f99d",
  },
  {
    value: "ebsa",
    governanceType: "EBSA",
    label: "Ecologically and Biologically Significant Area",
    shortLabel: "EBSA",
    color: "#f0abfc",
  },
  {
    value: "mca",
    governanceType: "MCA",
    label: "Marine Conserved Area",
    shortLabel: "Marine Conserved Area",
    color: "#2dd4bf",
  },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
