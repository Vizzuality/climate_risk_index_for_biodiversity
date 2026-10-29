import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

// Layers of the basemap style, hidden there, so the contours and their depth labels keep the
// style's design.
const DEPTH_STYLE_LAYERS = [
  { id: "Depth lines", opacityProperty: "line-opacity" },
  { id: "Depth text", opacityProperty: "text-opacity" },
] as const;

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
    };
    apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [mapRef, visible, opacity]);

  return null;
};
