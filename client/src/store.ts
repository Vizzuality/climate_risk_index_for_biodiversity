import { useQueryState } from "nuqs";
import { SCENARIO } from "@/types";
import { atom } from "jotai";
import { GeoJSONFeature, LngLat } from "mapbox-gl";

export const useScenario = () =>
  useQueryState<SCENARIO>("scenario", {
    defaultValue: "low",
    parse: (value) => value as SCENARIO,
    serialize: (value) => value,
  });

export const popupAtom = atom<(GeoJSONFeature & { lngLat: LngLat }) | null>(
  null,
);
