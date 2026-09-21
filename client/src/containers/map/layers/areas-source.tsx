import { Source } from "react-map-gl/mapbox";
import pmtilesUrl from "@/data/mpas.pmtiles?url";

export const AREAS_SOURCE_ID = "areas-source";
export const AREAS_SOURCE_LAYER = "mpas";
export const BIOREGIONS_SOURCE_LAYER = "bioregions";

// One source for both layers: each source opens its own PMTiles provider
// and fetches its own tiles, and every tile carries both layers.
export const AreasSource = ({ children }: React.PropsWithChildren) => {
  // Mapbox GL picks the PMTiles provider from the .pmtiles extension and
  // fetches the archive from its worker, which needs an absolute URL.
  const url =
    typeof window === "undefined" ? pmtilesUrl : new URL(pmtilesUrl, window.location.origin).href;

  return (
    <Source
      id={AREAS_SOURCE_ID}
      type="vector"
      url={url}
      promoteId={{ [AREAS_SOURCE_LAYER]: "id", [BIOREGIONS_SOURCE_LAYER]: "region" }}
    >
      {children}
    </Source>
  );
};
