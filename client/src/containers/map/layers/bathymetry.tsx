import type { ExpressionSpecification, FilterSpecification } from "mapbox-gl";
import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

// Layers of the basemap style, hidden there, so the contours and their depth labels keep the
// style's design.

const DEPTH_LINE_LAYER_ID = "Depth lines";
const DEPTH_TEXT_LAYER_ID = "Depth text";

const DEPTH_STYLE_LAYERS = [
  { id: DEPTH_LINE_LAYER_ID, opacityProperty: "line-opacity" },
  { id: DEPTH_TEXT_LAYER_ID, opacityProperty: "text-opacity" },
] as const;

// The depth polygons nest, each covering everything deeper than its min_depth, so their outlines
// are the isobaths. The style places one label per polygon; these place them along the outlines.
const DEPTH_TEXT_LAYOUT = [
  ["symbol-placement", "line"],
  ["symbol-spacing", 350],
  ["text-rotation-alignment", "map"],
  ["text-keep-upright", true],
] as const;

// The 0 m polygon's outline is the coastline
const DEPTH_FILTER: FilterSpecification = [">", ["get", "min_depth"], 0];

// Labels name the isobath they sit on: a halo in the depth fill's color cuts the line around them
const DEPTH_FILL_LAYER_ID = "bathymetry";
const DEPTH_TEXT_FIELD: ExpressionSpecification = [
  "concat",
  ["to-string", ["get", "min_depth"]],
  " m",
];

export const BathymetryLayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const apply = () => {
      for (const { id, opacityProperty } of DEPTH_STYLE_LAYERS) {
        if (!map.getLayer(id)) continue;
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        // Mirrors the style's zoom fade-in: a zoom expression can't be wrapped to scale it.
        map.setPaintProperty(id, opacityProperty, [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0,
          4,
          opacity,
        ]);
      }
      if (map.getLayer(DEPTH_TEXT_LAYER_ID)) {
        for (const [property, value] of DEPTH_TEXT_LAYOUT) {
          map.setLayoutProperty(DEPTH_TEXT_LAYER_ID, property, value);
        }
        map.setFilter(DEPTH_TEXT_LAYER_ID, DEPTH_FILTER);
        map.setLayoutProperty(DEPTH_TEXT_LAYER_ID, "text-field", DEPTH_TEXT_FIELD);
        const fillColor = map.getLayer(DEPTH_FILL_LAYER_ID)
          ? map.getPaintProperty(DEPTH_FILL_LAYER_ID, "fill-color")
          : undefined;
        if (fillColor) {
          map.setPaintProperty(DEPTH_TEXT_LAYER_ID, "text-halo-color", fillColor);
          map.setPaintProperty(DEPTH_TEXT_LAYER_ID, "text-halo-width", 3);
          map.setPaintProperty(DEPTH_TEXT_LAYER_ID, "text-halo-blur", 0);
        }
      }
    };
    apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [mapRef, visible, opacity]);

  return null;
};
