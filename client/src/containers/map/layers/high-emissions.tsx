import { Source, Layer } from "react-map-gl/mapbox";

const HighEmissionsLayer = () => {
  return (
    <Source
      id="high-emissions-source"
      type={"raster"}
      tiles={[
        `https://api.mapbox.com/v4/crib2025.4ogu7510/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      ]}
    >
      <Layer
        id="high-emissions-layer"
        type="raster"
        paint={{
          "raster-opacity": 1,
          "raster-resampling": "nearest",
        }}
      />
    </Source>
  );
};

export default HighEmissionsLayer;
