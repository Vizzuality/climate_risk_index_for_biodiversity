import { Layer } from "react-map-gl/mapbox";
import { AREAS_SOURCE_ID, BIOREGIONS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";

export const BioregionsLayer = () => {
  return (
    <>
      <Layer
        id="bioregions-layer"
        type="fill"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#ec9427",
        }}
      />

      <Layer
        id="bioregions-layer-outline-left"
        type="line"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#edd17e",
          "line-offset": -1,
          "line-opacity": 0.4,
        }}
      />

      <Layer
        id="bioregions-layer-outline"
        type="line"
        source-layer={BIOREGIONS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#edd17e",
          "line-opacity": 0.4,
        }}
      />
    </>
  );
};
