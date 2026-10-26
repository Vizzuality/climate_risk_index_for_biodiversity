export const PROTECTION_TYPES = [
  { value: "mca", governanceType: "MCA", label: "Marine Conserved Area" },
  { value: "aoi", governanceType: "AOI", label: "Area of Interest" },
  {
    value: "ebsa",
    governanceType: "EBSA",
    label: "Ecologically and Biologically Significant Area",
  },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
