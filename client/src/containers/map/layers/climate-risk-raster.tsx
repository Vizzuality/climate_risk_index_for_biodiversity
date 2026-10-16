import { COGLayer } from "@developmentseed/deck.gl-geotiff";

import { DeckGLOverlay } from "@/components/map/deckgl-overlay";
import { HIGH_EMISSIONS_RASTER_URL, LOW_EMISSIONS_RASTER_URL } from "@/lib/data-urls";
import { BASEMAP_LAND_FILL_LAYER_ID } from "@/lib/map-layers";
import type { SCENARIO } from "@/types";

const RASTER_URLS: Record<SCENARIO, string> = {
  low: LOW_EMISSIONS_RASTER_URL,
  high: HIGH_EMISSIONS_RASTER_URL,
};

// The COGs are paletted (risk class per pixel, color table and nodata set by
// `just classify-vulnerability`), so the layer's default pipeline renders them.
export function ClimateRiskRasterLayer({
  scenario,
  visible,
  opacity,
}: Readonly<{ scenario: SCENARIO; visible: boolean; opacity: number }>) {
  const layer = new COGLayer({
    id: `climate-risk-${scenario}`,
    geotiff: RASTER_URLS[scenario],
    visible,
    opacity,
    // @ts-expect-error beforeId is read by @deck.gl/mapbox but is not part of LayerProps
    beforeId: BASEMAP_LAND_FILL_LAYER_ID,
  });

  return <DeckGLOverlay layers={[layer]} interleaved />;
}
