import type { GeoJSONFeature } from "mapbox-gl";

export const AREAS_LAYER_ID = "wdpa-layer";

// Areas nest (EBSAs and network sites enclose reserves), so the smallest hit
// is the one the pointer is most specifically on.
export function pickAreaFeature(features: readonly GeoJSONFeature[]): GeoJSONFeature | undefined {
  let best: GeoJSONFeature | undefined;
  let bestArea = Infinity;
  for (const feature of features) {
    if (feature.layer?.id !== AREAS_LAYER_ID) continue;
    const area = feature.properties?.area_km2;
    const size = typeof area === "number" && Number.isFinite(area) ? area : Infinity;
    if (!best || size < bestArea) {
      best = feature;
      bestArea = size;
    }
  }
  return best;
}

export function pickHoverFeature(features: readonly GeoJSONFeature[]): GeoJSONFeature | undefined {
  return pickAreaFeature(features) ?? features.at(-1);
}
