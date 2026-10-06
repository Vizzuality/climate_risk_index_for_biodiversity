import { useId } from "react";
import { useAtom } from "jotai";
import { LucideChevronLeft, LucideChevronRight } from "lucide-react";

import { LegendItem } from "@/containers/map/legend/item";
import { isContextualLayer } from "@/lib/contextual-layers";
import { MAP_LAYERS } from "@/lib/map-layers";
import { legendOpenAtom, useContextualLayers, useLayerSettings } from "@/store";

export function MapLegend() {
  const [open, setOpen] = useAtom(legendOpenAtom);
  const { isOnMap, isVisible, opacity, setVisible, setOpacity } = useLayerSettings();
  const [, setContextualLayerVisible] = useContextualLayers();
  const listId = useId();
  const layers = MAP_LAYERS.filter((layer) => isOnMap(layer.value));
  const Chevron = open ? LucideChevronRight : LucideChevronLeft;

  return (
    <section
      aria-label="Map legend"
      className="absolute right-4 bottom-10 z-10 flex items-end gap-1"
    >
      <ul id={listId} hidden={!open} className="flex w-[270px] flex-col gap-1">
        {layers.map(({ value, label, legend }) => (
          <LegendItem
            key={value}
            label={label}
            legend={legend}
            visible={isVisible(value)}
            opacity={opacity(value)}
            onVisibleChange={(visible) => setVisible(value, visible)}
            onOpacityChange={(percent) => setOpacity(value, percent)}
            onRemove={
              isContextualLayer(value) ? () => setContextualLayerVisible(value, false) : undefined
            }
          />
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? "Hide legend" : "Show legend"}
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center justify-center rounded-full bg-slate-50 p-2 text-teal-400 hover:bg-slate-200"
      >
        <Chevron className="size-4" aria-hidden />
      </button>
    </section>
  );
}
