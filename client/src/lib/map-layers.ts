// Basemap style layers the app's layers are inserted under: the raster under the land fill, so it
// can reach past the coast without covering land, and the vector layers under the basemap's
// boundaries and labels.
export const BASEMAP_LAND_FILL_LAYER_ID = "country-land";
export const BASEMAP_BOUNDARIES_LAYER_ID = "admin-1-boundary-bg";

export const BIOREGIONS_OUTLINE_COLOR = "#ec9427";
// Darker than the raster's orange classes, which the outline colour blends into.
export const BIOREGIONS_HIGHLIGHT_COLOR = "#b45309";
// The basemap style draws the depth contours; this must stay in sync with its line colour.
export const BATHYMETRY_CONTOUR_COLOR = "#a6b0c5";

export type LegendSwatch = { label: string; color: string; shape: "outline" | "fill" };

export type MapLayerLegend =
  | { type: "discrete" }
  | { type: "governance-types" }
  | { type: "categories"; items: readonly LegendSwatch[] };

// Top to bottom in the order the map draws them.
export const MAP_LAYERS = [
  {
    value: "bathymetry",
    label: "Bathymetry",
    legend: {
      type: "categories",
      items: [{ label: "Depth contour", color: BATHYMETRY_CONTOUR_COLOR, shape: "outline" }],
    },
  },
  {
    value: "areas",
    label: "Conservation areas",
    legend: { type: "governance-types" },
  },
  {
    value: "bioregions",
    label: "Marine bioregions",
    legend: {
      type: "categories",
      items: [
        { label: "Bioregion", color: BIOREGIONS_OUTLINE_COLOR, shape: "outline" },
        { label: "Selected in region filter", color: BIOREGIONS_HIGHLIGHT_COLOR, shape: "fill" },
      ],
    },
  },
  { value: "species", label: "Species Climate Risk", legend: { type: "discrete" } },
  { value: "risk", label: "Climate Risk Index", legend: { type: "discrete" } },
] as const satisfies readonly { value: string; label: string; legend: MapLayerLegend }[];

export type MapLayer = (typeof MAP_LAYERS)[number]["value"];

export const MAP_LAYER_VALUES = MAP_LAYERS.map((layer) => layer.value);

export const mapLayerLabel = (value: MapLayer) =>
  MAP_LAYERS.find((layer) => layer.value === value)!.label;
