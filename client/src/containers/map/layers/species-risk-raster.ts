import { COGLayer } from "@developmentseed/deck.gl-geotiff";
import { useSetAtom } from "jotai";

import { speciesRasterUrl } from "@/lib/data-urls";
import { BASEMAP_LAND_FILL_LAYER_ID } from "@/lib/map-layers";
import { speciesBboxAtom } from "@/store";
import type { SCENARIO } from "@/types";

const SCENARIOS: SCENARIO[] = ["low", "high"];

export function useSpeciesRiskRasterLayers({
  speciesId,
  scenario,
  visible,
  opacity,
}: Readonly<{
  speciesId: number | undefined;
  scenario: SCENARIO;
  visible: boolean;
  opacity: number;
}>) {
  const setSpeciesBbox = useSetAtom(speciesBboxAtom);
  if (speciesId === undefined) return [];

  // Like the scenario rasters, both scenarios stay mounted and the inactive
  // one gets an unreachable `minZoom` so it fetches nothing.
  return SCENARIOS.map((s) => {
    const active = s === scenario;
    return new COGLayer({
      id: `species-risk-${s}`,
      geotiff: speciesRasterUrl(speciesId, s),
      visible: visible && active,
      minZoom: active ? 0 : 99,
      maxCacheSize: 200, // number of tiles
      opacity,
      // Both scenarios cover the same range, so one reports it for the map to fit.
      onGeoTIFFLoad:
        s === "low"
          ? (_, { geographicBounds: { west, south, east, north } }) =>
              setSpeciesBbox({ speciesId, bbox: [west, south, east, north] })
          : undefined,
      // @ts-expect-error beforeId is read by @deck.gl/mapbox but is not part of LayerProps
      beforeId: BASEMAP_LAND_FILL_LAYER_ID,
    });
  });
}
