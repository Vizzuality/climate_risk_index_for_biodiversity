import { Source, Layer } from "react-map-gl/mapbox";

const LowEmissionsLayer = () => {
  return (
    <Source
      id="low-emissions-source"
      type={"raster"}
      url="mapbox://crib2025.c8cusqs5"
      scheme={"xyz"}
    >
      <Layer
        id="low-emissions-layer"
        type="raster"
        paint={{
          "raster-resampling": "nearest",
        }}
      />
    </Source>
  );
};

export default LowEmissionsLayer;
