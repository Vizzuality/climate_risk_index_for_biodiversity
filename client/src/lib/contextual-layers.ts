import { type MapLayer, mapLayerLabel } from "@/lib/map-layers";

export const CONTEXTUAL_LAYER_GROUPS = [{ value: "general", label: "General layers" }] as const;

type ContextualLayerGroup = (typeof CONTEXTUAL_LAYER_GROUPS)[number]["value"];

export const CONTEXTUAL_LAYERS = [
  {
    value: "areas",
    group: "general",
    label: mapLayerLabel("areas"),
    description:
      "Outlines of the protected areas, OECMs, EBSAs, network sites and areas of interest listed in the table.",
  },
  {
    value: "bioregions",
    group: "general",
    label: mapLayerLabel("bioregions"),
    description:
      "Canada's 12 federal marine bioregions. The ones selected in the region filter are highlighted.",
  },
] as const satisfies readonly {
  value: MapLayer;
  group: ContextualLayerGroup;
  label: string;
  description: string;
}[];

export type ContextualLayer = (typeof CONTEXTUAL_LAYERS)[number]["value"];

export const CONTEXTUAL_LAYER_VALUES = CONTEXTUAL_LAYERS.map((layer) => layer.value);

export const isContextualLayer = (layer: MapLayer): layer is ContextualLayer =>
  (CONTEXTUAL_LAYER_VALUES as readonly MapLayer[]).includes(layer);
