const HECTARES_PER_KM2 = 100;

// Ranges are in hectares, lower bound inclusive and upper bound exclusive.
export const AREA_SIZES = [
  { value: "lt200", label: "<200Ha", min: 0, max: 200 },
  { value: "200-500", label: "200-500Ha", min: 200, max: 500 },
  { value: "500-1000", label: "500-1000Ha", min: 500, max: 1000 },
  { value: "gt1000", label: ">1000Ha", min: 1000, max: Infinity },
] as const;

export type AreaSize = (typeof AREA_SIZES)[number]["value"];

export const AREA_SIZE_VALUES = AREA_SIZES.map((size) => size.value);

export const isInAreaSize = (areaKm2: number, size: (typeof AREA_SIZES)[number]) => {
  const hectares = areaKm2 * HECTARES_PER_KM2;
  return hectares >= size.min && hectares < size.max;
};
