import { useMemo } from "react";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import { useAreaFilters } from "@/containers/main/store";
import { AREAS_SOURCE_ID, BIOREGIONS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { BIOREGIONS } from "@/lib/bioregions";
import {
  BASEMAP_BOUNDARIES_LAYER_ID,
  BIOREGIONS_HIGHLIGHT_COLOR,
  BIOREGIONS_OUTLINE_COLOR,
} from "@/lib/map-layers";

export const BioregionsLayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const layout = { visibility: visible ? "visible" : "none" } as const;
  const [{ region }] = useAreaFilters();

  const selected = useMemo((): LayerProps["filter"] => {
    const names = BIOREGIONS.filter((b) => region.includes(b.value)).map((b) => b.region);
    return ["in", ["get", "region"], ["literal", names]];
  }, [region]);

  return (
    <>
      <Layer
        id="bioregions-layer"
        type="fill"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": BIOREGIONS_OUTLINE_COLOR,
          "fill-opacity": opacity,
        }}
      />

      <Layer
        id="bioregions-layer-outline-left"
        type="line"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": "#edd17e",
          "line-offset": -1,
          "line-opacity": 0.4 * opacity,
        }}
      />

      <Layer
        id="bioregions-layer-outline"
        type="line"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": "#edd17e",
          "line-opacity": 0.4 * opacity,
        }}
      />
      <Layer
        id="bioregions-layer-selected"
        type="fill"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        filter={selected}
        paint={{ "fill-color": BIOREGIONS_HIGHLIGHT_COLOR, "fill-opacity": 0.15 * opacity }}
      />
      <Layer
        id="bioregions-layer-selected-outline"
        type="line"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        filter={selected}
        paint={{
          "line-color": BIOREGIONS_HIGHLIGHT_COLOR,
          "line-width": 2,
          "line-opacity": opacity,
        }}
      />
    </>
  );
};
