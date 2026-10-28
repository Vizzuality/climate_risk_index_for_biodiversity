import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type ControlPosition, useControl, useMap } from "react-map-gl/mapbox";
import type { IControl, Map } from "mapbox-gl";

const MAX_WIDTH = 100;

class ContainerControl implements IControl {
  readonly container = document.createElement("div");

  onAdd() {
    this.container.className = "mapboxgl-ctrl";
    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

// The largest 1, 2, 3 or 5 × 10ⁿ that fits, as Mapbox's own scale control rounds.
function roundScaleDistance(distance: number) {
  const pow10 = 10 ** Math.floor(Math.log10(distance));
  const digit = distance / pow10;
  return pow10 * ([5, 3, 2].find((step) => digit >= step) ?? 1);
}

const kilometers = new Intl.NumberFormat("en", { style: "unit", unit: "kilometer" });
const meters = new Intl.NumberFormat("en", { style: "unit", unit: "meter" });

// Mercator's scale changes with latitude, so the bar measures across the middle of the view.
function measure(map: Map) {
  const { clientWidth, clientHeight } = map.getContainer();
  const y = clientHeight / 2;
  const x = (clientWidth - MAX_WIDTH) / 2;
  const maxMeters = map.unproject([x, y]).distanceTo(map.unproject([x + MAX_WIDTH, y]));
  const inKm = maxMeters >= 1000;
  const max = inKm ? maxMeters / 1000 : maxMeters;
  const distance = roundScaleDistance(max);
  return {
    label: (inKm ? kilometers : meters).format(distance),
    width: (MAX_WIDTH * distance) / max,
  };
}

export function ScaleBar({ position }: Readonly<{ position: ControlPosition }>) {
  const { container } = useControl(() => new ContainerControl(), { position });
  const { current: mapRef } = useMap();
  const [scale, setScale] = useState<ReturnType<typeof measure>>();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const update = () => setScale(measure(map));
    update();
    map.on("move", update);
    return () => {
      map.off("move", update);
    };
  }, [mapRef]);

  if (!scale) return null;
  return createPortal(
    <div className="flex items-center gap-1.5 text-[10px] leading-[14px] font-bold text-white">
      {scale.label}
      <span
        aria-hidden
        className="h-1.5 border border-t-0 border-white"
        style={{ width: scale.width }}
      />
    </div>,
    container,
  );
}
