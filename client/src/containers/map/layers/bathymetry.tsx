import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

// A layer of the basemap style, hidden there, so the contours keep the style's design.
const DEPTH_STYLE_LAYER_ID = "Depth";

export const BathymetryLayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const apply = () => {
      if (!map.getLayer(DEPTH_STYLE_LAYER_ID)) return;
      map.setLayoutProperty(DEPTH_STYLE_LAYER_ID, "visibility", visible ? "visible" : "none");
      // Mirrors the style's zoom fade-in: a zoom expression can't be wrapped to scale it.
      map.setPaintProperty(DEPTH_STYLE_LAYER_ID, "line-opacity", [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0,
        4,
        opacity,
      ]);
    };
    apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [mapRef, visible, opacity]);

  return null;
};
