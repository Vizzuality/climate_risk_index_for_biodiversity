import { Layer } from "react-map-gl/mapbox";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";

export const WDPALayer = () => {
  const params = useParams({ strict: false });
  const { area } = params;
  const selected = area ? { filter: ["==", ["to-string", ["get", "id"]], area] } : {};

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
