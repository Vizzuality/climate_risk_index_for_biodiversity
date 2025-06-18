import { Source, Layer } from "react-map-gl/mapbox";
import { useParams } from "next/navigation";

const WDPALayer = () => {
  const params = useParams<{ area: string }>();
  const { area } = params;

  return (
    <Source
      id="wdpa-source"
      type={"vector"}
      url="mapbox://crib2025.boh9hmga"
      promoteId="name_en"
    >
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer="marine_protected_areas-cg767v"
        source={"wdpa-source"}
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#2DD4BF",
        }}
        {...(area && {
          filter: [
            "any",
            false,
            ["==", ["get", "name_en"], window.decodeURIComponent(area)],
          ],
        })}
      />
    </Source>
  );
};

export default WDPALayer;
