export const PROTECTION_TYPES = [
  { value: "pa", areaType: "MPA", label: "Protected area" },
  { value: "oecm", areaType: "OECM", label: "Other effective area-based conservation measure" },
  { value: "ebsa", areaType: "EBSA", label: "Ecologically and Biologically Significant Area" },
  { value: "network-site", areaType: "Network Site", label: "Conservation network site" },
  { value: "aoi", areaType: "AOI", label: "Area of Interest" },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
