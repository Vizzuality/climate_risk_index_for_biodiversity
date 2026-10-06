import type { Area } from "@/containers/main/table/columns";
import type { SearchCodec } from "@/lib/search-params";

export type Bbox = NonNullable<Area["bbox"]>;

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

export function clampBbox(bbox: Bbox, bounds: Bbox): Bbox | null {
  const clamped: Bbox = [
    Math.max(bbox[0], bounds[0]),
    Math.max(bbox[1], bounds[1]),
    Math.min(bbox[2], bounds[2]),
    Math.min(bbox[3], bounds[3]),
  ];
  return clamped[0] <= clamped[2] && clamped[1] <= clamped[3] ? clamped : null;
}

const round = (value: number) => Number(value.toFixed(5));

// Longitudes aren't wrapped to ±180: the map's max bounds start west of the antimeridian.
export const bboxCodec: SearchCodec<Bbox | null> = {
  parse: (raw) => {
    if (typeof raw !== "string") return null;
    const values = raw.split(",").map((value) => (value.trim() === "" ? NaN : Number(value)));
    if (values.length !== 4 || !values.every(Number.isFinite)) return null;
    const [west, south, east, north] = values;
    return west < east && south < north ? [west, south, east, north] : null;
  },
  serialize: (bbox) => (bbox ? bbox.map(round).join(",") : ""),
};
