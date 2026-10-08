import { useMemo } from "react";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { AREAS_OUTLINE_COLOR, BASEMAP_BOUNDARIES_LAYER_ID } from "@/lib/map-layers";

const AREA_ID = ["to-string", ["get", "id"]];

export const WDPALayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const layout = { visibility: visible ? "visible" : "none" } as const;
  const { areaId } = useParams({ strict: false });
  const { data: matches, isFiltered } = useFilteredAreas();

  const selected = useMemo((): Pick<LayerProps, "filter"> => {
    if (areaId) return { filter: ["==", AREA_ID, areaId] };
    if (isFiltered && matches)
      return { filter: ["in", AREA_ID, ["literal", matches.map((a) => a.id)]] };
    return {};
  }, [areaId, isFiltered, matches]);

  return (
    <>
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#EAF3ED",
          "fill-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": "#1e3152",
          "line-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-left"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": AREAS_OUTLINE_COLOR,
          "line-offset": -1,
          "line-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-right"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": AREAS_OUTLINE_COLOR,
          "line-offset": 1,
          "line-opacity": opacity,
        }}
        {...selected}
      />
    </>
  );
};
