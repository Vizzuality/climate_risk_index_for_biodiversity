import { Source, Layer } from "react-map-gl/mapbox";
import { useParams } from "next/navigation";

const WDPALayer = () => {
  const params = useParams<{ area: string }>();
  const { area } = params;

  return (
    <Source
      id="wdpa-source"
      type={"vector"}
      url="mapbox://crib2025.mpas-tiles"
      promoteId="name_en"
    >
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer="marine-protected-areas"
        source={"wdpa-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#EAF3ED",
        }}
        {...(area && {
          filter: [
            "any",
            false,
            ["==", ["get", "name_en"], window.decodeURIComponent(area)],
          ],
        })}
      />

      <Layer
        id="wdpa-layer-outline-left"
        type="line"
        source-layer="marine-protected-areas"
        source={"wdpa-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "line-color": "#8ABAA5",
          "line-offset": -1,
        }}
        {...(area && {
          filter: [
            "any",
            false,
            ["==", ["get", "name_en"], window.decodeURIComponent(area)],
          ],
        })}
      />

      <Layer
        id="wdpa-layer-outline-right"
        type="line"
        source-layer="marine-protected-areas"
        source={"wdpa-source"}
        beforeId={"maritimes-region-b5kyh8"}
        paint={{
          "line-color": "#8ABAA5",
          "line-offset": 1,
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
