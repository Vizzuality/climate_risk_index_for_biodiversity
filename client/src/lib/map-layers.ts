export const AREAS_OUTLINE_COLOR = "#5eead4";
export const BIOREGIONS_OUTLINE_COLOR = "#ec9427";
// Darker than the raster's orange classes, which the outline colour blends into.
export const BIOREGIONS_HIGHLIGHT_COLOR = "#b45309";

export type LegendSwatch = { label: string; color: string; shape: "outline" | "fill" };

export type MapLayerLegend =
  | { type: "discrete" }
  | { type: "categories"; items: readonly LegendSwatch[] };

// Top to bottom in the order the map draws them.
export const MAP_LAYERS = [
  {
    value: "areas",
    label: "Conservation areas",
    legend: {
      type: "categories",
      items: [{ label: "Conservation area", color: AREAS_OUTLINE_COLOR, shape: "outline" }],
    },
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
  { value: "risk", label: "Climate Risk Index", legend: { type: "discrete" } },
] as const satisfies readonly { value: string; label: string; legend: MapLayerLegend }[];

export type MapLayer = (typeof MAP_LAYERS)[number]["value"];

export const MAP_LAYER_VALUES = MAP_LAYERS.map((layer) => layer.value);

export const mapLayerLabel = (value: MapLayer) =>
  MAP_LAYERS.find((layer) => layer.value === value)!.label;
