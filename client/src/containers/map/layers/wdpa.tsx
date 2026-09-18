import { Source, Layer } from "react-map-gl/mapbox";
import { useParams } from "@tanstack/react-router";
import pmtilesUrl from "@/data/mpas.pmtiles?url";

const SOURCE_LAYER = "mpas";

const WDPALayer = () => {
  const params = useParams({ strict: false });
  const { area } = params;
  // Mapbox GL picks the PMTiles provider from the .pmtiles extension and
  // fetches the archive from its worker, which needs an absolute URL.
  const url =
    typeof window === "undefined" ? pmtilesUrl : new URL(pmtilesUrl, window.location.origin).href;
  const selected = area ? { filter: ["==", ["to-string", ["get", "id"]], area] } : {};

  return (
    <Source id="wdpa-source" type="vector" url={url} promoteId="id">
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer={SOURCE_LAYER}
        source="wdpa-source"
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
        source-layer={SOURCE_LAYER}
        source="wdpa-source"
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#1e3152",
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-left"
        type="line"
        source-layer={SOURCE_LAYER}
        source="wdpa-source"
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
        source-layer={SOURCE_LAYER}
        source="wdpa-source"
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": "#5eead4",
          "line-offset": 1,
        }}
        {...selected}
      />
    </Source>
  );
};

export default WDPALayer;
