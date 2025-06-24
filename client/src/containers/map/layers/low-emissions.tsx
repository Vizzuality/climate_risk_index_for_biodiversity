import { Source, Layer } from "react-map-gl/mapbox";

const LowEmissionsLayer = () => {
  return (
    <Source
      id="low-emissions-source"
      type="vector"
      url="mapbox://crib2025.climrisk-low"
      scheme="xyz"
    >
      <Layer
        id="low-emissions-layer"
        type="fill"
        beforeId="country-boundaries"
        source-layer="climrisk-low"
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
          "fill-opacity": 0.8,
          "fill-outline-color": "#000",
        }}
      />
    </Source>
  );
};

export default LowEmissionsLayer;
