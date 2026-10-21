import { COGLayer } from "@developmentseed/deck.gl-geotiff";

import { HIGH_EMISSIONS_RASTER_URL, LOW_EMISSIONS_RASTER_URL } from "@/lib/data-urls";
import { BASEMAP_LAND_FILL_LAYER_ID } from "@/lib/map-layers";
import type { SCENARIO } from "@/types";

const RASTER_URLS: Record<SCENARIO, string> = {
  low: LOW_EMISSIONS_RASTER_URL,
  high: HIGH_EMISSIONS_RASTER_URL,
};

// The COGs are paletted (risk class per pixel, color table and nodata set by
// `just classify-vulnerability`), so the layer's default pipeline renders them.
export function climateRiskRasterLayers({
  scenario,
  visible,
  opacity,
}: Readonly<{ scenario: SCENARIO; visible: boolean; opacity: number }>) {
  // Both scenarios stay mounted so switching keeps each layer's parsed GeoTIFF
  // and tile cache. `visible: false` alone doesn't stop a TileLayer fetching,
  // so the inactive one gets an unreachable `minZoom`, which makes its tileset
  // select no tiles. `minZoom` must be finite on both sides: Tileset2D ignores
  // non-finite values, so it would never reset. `maxCacheSize` is fixed
  // because the default scales with selected tiles.
  return (Object.keys(RASTER_URLS) as SCENARIO[]).map((s) => {
    const active = s === scenario;
    return new COGLayer({
      id: `climate-risk-${s}`,
      geotiff: RASTER_URLS[s],
      visible: visible && active,
      minZoom: active ? 0 : 99,
      maxCacheSize: 200, // number of tiles
      opacity,
      // @ts-expect-error beforeId is read by @deck.gl/mapbox but is not part of LayerProps
      beforeId: BASEMAP_LAND_FILL_LAYER_ID,
    });
  });
}
