import { useEffect, useMemo, useState } from "react";
import type { Device, Texture } from "@luma.gl/core";
import { COGLayer, type GetTileDataOptions } from "@developmentseed/deck.gl-geotiff";
import type { RenderTileResult } from "@developmentseed/deck.gl-raster";
import {
  Colormap,
  createColormapTexture,
  CreateTexture,
} from "@developmentseed/deck.gl-raster/gpu-modules";
import type { GeoTIFF, Overview } from "@developmentseed/geotiff";
import { parseWkt, type ProjectionDefinition } from "@developmentseed/proj";

import { DeckGLOverlay } from "@/components/map/deckgl-overlay";
import { DiscardMasked } from "@/containers/map/layers/gpu-modules/discard-masked";
import epsg3857 from "@/data/epsg-3857.json";
import lowEmissionsUrl from "@/data/126_low_emissions_climvuln_cog.tif?url";
import highEmissionsUrl from "@/data/585_high_emissions_climvuln_cog.tif?url";
import { buildRiskColormap, COLORMAP_WIDTH } from "@/lib/risk-colormap";
import type { SCENARIO } from "@/types";

const RASTER_URLS: Record<SCENARIO, string> = {
  low: lowEmissionsUrl,
  high: highEmissionsUrl,
};

type TileData = { texture: Texture; byteLength: number; width: number; height: number };

// The rasters are EPSG:3857; resolving the code locally keeps the library's
// epsg.io lookup off the critical path and rejects any other CRS.
const WEB_MERCATOR = parseWkt(epsg3857 as Parameters<typeof parseWkt>[0]);

async function epsgResolver(code: number): Promise<ProjectionDefinition> {
  if (code === 3857) return WEB_MERCATOR;
  throw new Error(`Unsupported raster CRS EPSG:${code}`);
}

async function getTileData(
  image: GeoTIFF | Overview,
  { device, x, y, pool, signal }: GetTileDataOptions,
): Promise<TileData> {
  const { array } = await image.fetchTile(x, y, { boundless: false, pool, signal });
  if (array.layout !== "pixel-interleaved") {
    throw new Error("Expected a pixel-interleaved raster");
  }
  const { width, height, data } = array;
  const texture = device.createTexture({
    data,
    format: "rg32float",
    width,
    height,
    sampler: { minFilter: "nearest", magFilter: "nearest" },
  });
  return { texture, byteLength: data.byteLength, width, height };
}

export function ClimateRiskRasterLayer({ scenario }: { scenario: SCENARIO }) {
  const [device, setDevice] = useState<Device | null>(null);

  const colormap = useMemo(
    () =>
      device
        ? createColormapTexture(device, new ImageData(buildRiskColormap(), COLORMAP_WIDTH, 1))
        : null,
    [device],
  );
  useEffect(() => () => colormap?.destroy(), [colormap]);

  const renderTile = useMemo(
    () =>
      (data: TileData): RenderTileResult | null =>
        colormap
          ? {
              renderPipeline: [
                { module: CreateTexture, props: { textureName: data.texture } },
                { module: DiscardMasked },
                { module: Colormap, props: { colormapTexture: colormap } },
              ],
            }
          : null,
    [colormap],
  );

  const url = RASTER_URLS[scenario];
  const layer = new COGLayer<TileData>({
    id: `climate-risk-${scenario}`,
    geotiff: typeof window === "undefined" ? url : new URL(url, window.location.origin).href,
    epsgResolver,
    getTileData,
    renderTile,
    updateTriggers: { renderTile: [colormap] },
    onTileUnload: (tile) => (tile.content as TileData | null)?.texture.destroy(),
    // @ts-expect-error beforeId is read by @deck.gl/mapbox but is not part of LayerProps
    beforeId: "country-boundaries",
  });

  return <DeckGLOverlay layers={[layer]} interleaved onDeviceInitialized={setDevice} />;
}
