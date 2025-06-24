import { Source, Layer } from "react-map-gl/mapbox";

const HighEmissionsLayer = () => {
  return (
    <Source
      id="high-emissions-source"
      type="vector"
      url="mapbox://crib2025.climrisk-high"
      scheme="xyz"
    >
      <Layer
        id="high-emissions-layer"
        type="fill"
        beforeId="wdpa-layer"
        source-layer="climrisk-high"
        paint={{
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "val"],
            0,
            "#000000",
            1,
            "#45B9C7",
            2,
            "#B5E2D1",
            3,
            "#F1BC83",
            4,
            "#DA5730",
          ],
          "fill-opacity": 0.6,
          "fill-outline-color": "#000",
        }}
      />
    </Source>
  );
};

export default HighEmissionsLayer;
