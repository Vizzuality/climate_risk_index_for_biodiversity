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
import { type Bbox, bboxCodec } from "@/lib/bbox";
import {
  CONTEXTUAL_LAYER_VALUES,
  type ContextualLayer,
  isContextualLayer,
} from "@/lib/contextual-layers";
import { MAP_LAYER_VALUES, type MapLayer } from "@/lib/map-layers";
import { multiValue, percentByKey } from "@/lib/search-params";
import { SCENARIO } from "@/types";

const DEFAULT_SCENARIO: SCENARIO = "low";

const contextualLayersCodec = multiValue(CONTEXTUAL_LAYER_VALUES, ["areas"]);

const DEFAULT_LAYERS = contextualLayersCodec.serialize(contextualLayersCodec.parse(undefined));

const hiddenLayersCodec = multiValue(MAP_LAYER_VALUES);

const layerOpacityCodec = percentByKey(MAP_LAYER_VALUES);

const isOnMap = (layer: MapLayer, contextualLayers: readonly ContextualLayer[]) =>
  !isContextualLayer(layer) || contextualLayers.includes(layer);

type LayerSettingsSearch = { layers: string; hidden: string; opacity: string };

// Visibility and opacity only apply to layers on the map; a layer that leaves it loses both.
const keepLayerSettingsOnMap = <T extends Partial<LayerSettingsSearch>>(
  search: T,
): T & Pick<LayerSettingsSearch, "hidden" | "opacity"> => {
  const onMap = (layer: MapLayer) => isOnMap(layer, contextualLayersCodec.parse(search.layers));
  const opacity = Object.entries(layerOpacityCodec.parse(search.opacity)).filter(([layer]) =>
    onMap(layer as MapLayer),
  );
  return {
    ...search,
    hidden: hiddenLayersCodec.serialize(hiddenLayersCodec.parse(search.hidden).filter(onMap)),
    opacity: layerOpacityCodec.serialize(Object.fromEntries(opacity)),
  };
};

type RootSearch = LayerSettingsSearch & { scenario: SCENARIO; bbox?: string };

export const rootSearch = {
  validateSearch: (
    search: {
      scenario?: unknown;
      layers?: unknown;
      hidden?: unknown;
      opacity?: unknown;
      bbox?: unknown;
    } & SearchSchemaInput,
  ): RootSearch =>
    keepLayerSettingsOnMap({
      scenario: search.scenario === "high" ? "high" : DEFAULT_SCENARIO,
      layers: contextualLayersCodec.serialize(contextualLayersCodec.parse(search.layers)),
      hidden: hiddenLayersCodec.serialize(hiddenLayersCodec.parse(search.hidden)),
      opacity: layerOpacityCodec.serialize(layerOpacityCodec.parse(search.opacity)),
      bbox: bboxCodec.serialize(bboxCodec.parse(search.bbox)) || undefined,
    }),
  search: {
    middlewares: [
      // Strip must wrap retain: retain re-adds the validated default from the current location.
      stripSearchParams<RootSearch>({
        scenario: DEFAULT_SCENARIO,
        layers: DEFAULT_LAYERS,
        hidden: "",
        opacity: "",
      }),
      retainSearchParams<RootSearch>(["scenario", "layers", "hidden", "opacity", "bbox"]),
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
        return keepLayerSettingsOnMap({ ...prev, layers: contextualLayersCodec.serialize(next) });
      },
      replace: true,
    });
  return [visible, setLayerVisible] as const;
};

export const useLayerSettings = () => {
  const { layers, hidden, opacity } = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const contextualLayers = useMemo(() => contextualLayersCodec.parse(layers), [layers]);
  const hiddenLayers = useMemo(() => hiddenLayersCodec.parse(hidden), [hidden]);
  const opacities = useMemo(() => layerOpacityCodec.parse(opacity), [opacity]);

  const isLayerOnMap = (layer: MapLayer) => isOnMap(layer, contextualLayers);
  const isVisible = (layer: MapLayer) => isLayerOnMap(layer) && !hiddenLayers.includes(layer);
  const layerOpacity = (layer: MapLayer) => opacities[layer] ?? 100;

  const setVisible = (layer: MapLayer, visible: boolean) =>
    navigate({
      to: ".",
      search: (prev) => {
        const current = hiddenLayersCodec.parse(prev.hidden);
        const next = visible ? current.filter((value) => value !== layer) : [...current, layer];
        return { ...prev, hidden: hiddenLayersCodec.serialize(next) };
      },
      replace: true,
    });
  const setOpacity = (layer: MapLayer, percent: number) =>
    navigate({
      to: ".",
      search: (prev) => {
        const next = { ...layerOpacityCodec.parse(prev.opacity), [layer]: percent };
        return { ...prev, opacity: layerOpacityCodec.serialize(next) };
      },
      replace: true,
    });

  return { isOnMap: isLayerOnMap, isVisible, opacity: layerOpacity, setVisible, setOpacity };
};

export const useMapBbox = () => {
  const { bbox } = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const value = useMemo(() => bboxCodec.parse(bbox), [bbox]);
  const setBbox = (next: Bbox) =>
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, bbox: bboxCodec.serialize(next) || undefined }),
      replace: true,
    });
  return [value, setBbox] as const;
};

export const popupAtom = atom<(GeoJSONFeature & { lngLat: LngLat }) | null>(null);

export const contextualLayersPanelOpenAtom = atom(false);

export const legendOpenAtom = atom(true);

// Shared with the deck overlay, which rewrites the map canvas cursor on every frame it draws.
export const mapCursorAtom = atom<string | undefined>(undefined);
