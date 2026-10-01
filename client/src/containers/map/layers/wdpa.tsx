import { useMemo } from "react";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";

const AREA_ID = ["to-string", ["get", "id"]];

export const WDPALayer = () => {
  const { areaId } = useParams({ strict: false });
  const { data: matches, q } = useFilteredAreas();

  const selected = useMemo((): Pick<LayerProps, "filter"> => {
    if (areaId) return { filter: ["==", AREA_ID, areaId] };
    if (q && matches) return { filter: ["in", AREA_ID, ["literal", matches.map((a) => a.id)]] };
    return {};
  }, [areaId, q, matches]);

  return (
    <>
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#EAF3ED",
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#1e3152",
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-left"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#5eead4",
          "line-offset": -1,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-right"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#5eead4",
          "line-offset": 1,
        }}
        {...selected}
      />
    </>
  );
};
