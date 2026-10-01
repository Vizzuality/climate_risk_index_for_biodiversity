const BIOREGION_REGIONS = [
  { value: "arctic-archipelago", region: "Arctic Archipelago" },
  { value: "arctic-basin", region: "Arctic Basin" },
  { value: "eastern-arctic", region: "Eastern Arctic" },
  { value: "gulf-st-lawrence", region: "The Estuary and the Gulf of St. Lawrence" },
  { value: "hudson-bay", region: "Hudson Bay Complex" },
  { value: "newfoundland-labrador", region: "Newfoundland-Labrador Shelves" },
  { value: "northern-shelf", region: "Northern Shelf" },
  { value: "offshore-pacific", region: "Offshore Pacific" },
  { value: "scotian-shelf", region: "Scotian Shelf and Bay of Fundy" },
  { value: "southern-shelf", region: "Southern Shelf" },
  { value: "strait-of-georgia", region: "Strait of Georgia" },
  { value: "western-arctic", region: "Western Arctic" },
] as const;

export type Bioregion = (typeof BIOREGION_REGIONS)[number]["value"];

export const BIOREGIONS = BIOREGION_REGIONS.map((bioregion) => ({
  ...bioregion,
  label: bioregion.region.replace(/^The /, ""),
}));

export const BIOREGION_VALUES = BIOREGIONS.map((bioregion) => bioregion.value);
