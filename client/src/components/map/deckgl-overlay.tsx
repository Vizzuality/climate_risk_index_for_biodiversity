import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import { useAtomValue } from "jotai";
import { useControl } from "react-map-gl/mapbox";
import { mapCursorAtom } from "@/store";

export function DeckGLOverlay(props: MapboxOverlayProps) {
  const cursor = useAtomValue(mapCursorAtom);
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps({
    getCursor: ({ isDragging }) => (isDragging ? "grabbing" : (cursor ?? "grab")),
    ...props,
  });
  return null;
}
