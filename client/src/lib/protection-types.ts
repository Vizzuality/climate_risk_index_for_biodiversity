export const PROTECTION_TYPES = [
  { value: "pa", layerType: "MPA", label: "Protected area" },
  { value: "oecm", layerType: "OECM", label: "Other effective area-based conservation measure" },
  { value: "ebsa", layerType: "EBSA", label: "Ecologically and Biologically Significant Area" },
  { value: "network-site", layerType: "Network Site", label: "Conservation network site" },
  { value: "aoi", layerType: "AOI", label: "Area of Interest" },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
