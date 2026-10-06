// Colours only need to be told apart from each other (checked for colour-blind and normal
// vision); contrast over the raster comes from the dark line drawn between them on the map.
export const PROTECTION_TYPES = [
  {
    value: "pa",
    layerType: "MPA",
    label: "Protected area",
    shortLabel: "Protected area",
    color: "#2a78d6",
  },
  {
    value: "oecm",
    layerType: "OECM",
    label: "Other effective area-based conservation measure",
    shortLabel: "OECM",
    color: "#008300",
  },
  {
    value: "ebsa",
    layerType: "EBSA",
    label: "Ecologically and Biologically Significant Area",
    shortLabel: "EBSA",
    color: "#4a3aa7",
  },
  {
    value: "network-site",
    layerType: "Network Site",
    label: "Conservation network site",
    shortLabel: "Network site",
    color: "#c2337a",
  },
  {
    value: "aoi",
    layerType: "AOI",
    label: "Area of Interest",
    shortLabel: "Area of Interest",
    color: "#a3a300",
  },
] as const;

export type ProtectionType = (typeof PROTECTION_TYPES)[number]["value"];

export const PROTECTION_TYPE_VALUES = PROTECTION_TYPES.map((type) => type.value);
