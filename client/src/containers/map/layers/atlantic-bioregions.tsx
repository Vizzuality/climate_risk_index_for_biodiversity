import { Source, Layer } from "react-map-gl/mapbox";

const AtlanticBioregionsLayer = () => {
  return (
    <Source
      id="atlantic-bioregions-source"
      type={"vector"}
      url="mapbox://crib2025.ckddm95n"
      promoteId="NAME_E"
    >
      <Layer
        id="atlantic-bioregions-layer"
        type="fill"
        source-layer="AtlanticBioregions-14vrei"
        source={"atlantic-bioregions-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#ec9427",
        }}
      />

      <Layer
        id="atlantic-bioregions-layer--outline-left"
        type="line"
        source-layer="AtlanticBioregions-14vrei"
        source={"atlantic-bioregions-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "line-color": "#edd17e",
          "line-offset": -1,
          "line-opacity": 0.4,
        }}
      />

      <Layer
        id="atlantic-bioregions-layer-outline"
        type="line"
        source-layer="AtlanticBioregions-14vrei"
        source={"atlantic-bioregions-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "line-color": "#edd17e",
          "line-opacity": 0.4,
        }}
      />
    </Source>
  );
};

export default AtlanticBioregionsLayer;
