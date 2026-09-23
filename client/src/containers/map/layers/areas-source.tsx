import { Source } from "react-map-gl/mapbox";
import { AREAS_PMTILES_URL } from "@/lib/data-urls";

export const AREAS_SOURCE_ID = "areas-source";
export const AREAS_SOURCE_LAYER = "mpas";
export const BIOREGIONS_SOURCE_LAYER = "bioregions";

// One source for both layers: each source opens its own PMTiles provider
// and fetches its own tiles, and every tile carries both layers.
export const AreasSource = ({ children }: React.PropsWithChildren) => (
  <Source
    id={AREAS_SOURCE_ID}
    type="vector"
    url={AREAS_PMTILES_URL}
    promoteId={{ [AREAS_SOURCE_LAYER]: "id", [BIOREGIONS_SOURCE_LAYER]: "region" }}
  >
    {children}
  </Source>
);
