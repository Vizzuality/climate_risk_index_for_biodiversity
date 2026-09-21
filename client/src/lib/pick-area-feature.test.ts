import { describe, expect, it } from "vitest";
import type { GeoJSONFeature } from "mapbox-gl";
import { AREAS_LAYER_ID, pickAreaFeature, pickHoverFeature } from "@/lib/pick-area-feature";

function feature(layerId: string, id: string | number, area_km2?: number | null) {
  return {
    id,
    layer: { id: layerId },
    properties: { id, ...(area_km2 !== undefined && { area_km2 }) },
  } as unknown as GeoJSONFeature;
}

const bioregion = feature("bioregions-layer", "Newfoundland-Labrador Shelves");
const ebsa = feature(AREAS_LAYER_ID, 1049, 9399.66);
const reserve = feature(AREAS_LAYER_ID, 1, 5);

describe("pickAreaFeature", () => {
  it("prefers the smallest area when hits are nested", () => {
    expect(pickAreaFeature([bioregion, ebsa, reserve])?.id).toBe(1);
    expect(pickAreaFeature([reserve, ebsa])?.id).toBe(1);
  });

  it("ignores features from other layers", () => {
    expect(pickAreaFeature([bioregion])).toBeUndefined();
    expect(pickAreaFeature([])).toBeUndefined();
  });

  it("treats a missing or null area as the largest", () => {
    const unknown = feature(AREAS_LAYER_ID, 7, null);
    expect(pickAreaFeature([unknown, ebsa])?.id).toBe(1049);
    expect(pickAreaFeature([unknown])?.id).toBe(7);
  });
});

describe("pickHoverFeature", () => {
  it("falls back to the last non-area feature when no area is hit", () => {
    expect(pickHoverFeature([bioregion])?.id).toBe("Newfoundland-Labrador Shelves");
  });

  it("still prefers the smallest area over the fallback", () => {
    expect(pickHoverFeature([ebsa, bioregion, reserve])?.id).toBe(1);
  });
});
