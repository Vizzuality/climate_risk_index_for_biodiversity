import {
  type SearchSchemaInput,
  retainSearchParams,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { atom } from "jotai";
import { GeoJSONFeature, LngLat } from "mapbox-gl";
import { useMemo } from "react";
import { CONTEXTUAL_LAYER_VALUES, type ContextualLayer } from "@/lib/contextual-layers";
import { multiValue } from "@/lib/search-params";
import { SCENARIO } from "@/types";

const DEFAULT_SCENARIO: SCENARIO = "low";

const contextualLayersCodec = multiValue(CONTEXTUAL_LAYER_VALUES);

// The param lists the visible layers, so a missing param means every layer and an
// empty one means none.
const DEFAULT_LAYERS = contextualLayersCodec.serialize(CONTEXTUAL_LAYER_VALUES);

type RootSearch = { scenario: SCENARIO; layers: string };

export const rootSearch = {
  validateSearch: (
    search: { scenario?: unknown; layers?: unknown } & SearchSchemaInput,
  ): RootSearch => ({
    scenario: search.scenario === "high" ? "high" : DEFAULT_SCENARIO,
    layers:
      typeof search.layers === "string"
        ? contextualLayersCodec.serialize(contextualLayersCodec.parse(search.layers))
        : DEFAULT_LAYERS,
  }),
  search: {
    middlewares: [
      // Strip must wrap retain: retain re-adds the validated default from the current location.
      stripSearchParams<RootSearch>({ scenario: DEFAULT_SCENARIO, layers: DEFAULT_LAYERS }),
      retainSearchParams<RootSearch>(["scenario", "layers"]),
    ],
  },
};

export const useScenario = () => {
  const { scenario } = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const setScenario = (next: SCENARIO) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, scenario: next }), replace: true });
  return [scenario, setScenario] as const;
};

export const useContextualLayers = () => {
  const { layers } = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const visible = useMemo(() => contextualLayersCodec.parse(layers), [layers]);
  const setLayerVisible = (layer: ContextualLayer, show: boolean) =>
    navigate({
      to: ".",
      search: (prev) => {
        const current = contextualLayersCodec.parse(prev.layers);
        const next = show ? [...current, layer] : current.filter((value) => value !== layer);
        return { ...prev, layers: contextualLayersCodec.serialize(next) };
      },
      replace: true,
    });
  return [visible, setLayerVisible] as const;
};

export const popupAtom = atom<(GeoJSONFeature & { lngLat: LngLat }) | null>(null);

export const contextualLayersPanelOpenAtom = atom(false);
