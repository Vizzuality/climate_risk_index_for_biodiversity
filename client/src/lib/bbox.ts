import type { Area } from "@/containers/main/table/columns";

type Bbox = NonNullable<Area["bbox"]>;

export function unionBbox(areas: readonly Area[]): Bbox | null {
  let union: Bbox | null = null;
  for (const { bbox } of areas) {
    if (!bbox) continue;
    union = union
      ? [
          Math.min(union[0], bbox[0]),
          Math.min(union[1], bbox[1]),
          Math.max(union[2], bbox[2]),
          Math.max(union[3], bbox[3]),
        ]
      : bbox;
  }
  return union;
}

export function clampBbox(bbox: Bbox, bounds: Bbox): Bbox {
  return [
    Math.max(bbox[0], bounds[0]),
    Math.max(bbox[1], bounds[1]),
    Math.min(bbox[2], bounds[2]),
    Math.min(bbox[3], bounds[3]),
  ];
}
