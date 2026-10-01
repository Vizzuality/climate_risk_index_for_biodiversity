import { useEffect, useMemo, useRef, useState } from "react";
import ReactMapGL, { Popup } from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import type { MapMouseEvent } from "mapbox-gl";
import { useNavigate, useParams } from "@tanstack/react-router";

import { useAreas } from "@/hooks/use-areas";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { clampBbox, unionBbox } from "@/lib/bbox";
import { useAtom } from "jotai";
import { popupAtom } from "@/store";
import { pickAreaFeature, pickHoverFeature } from "@/lib/pick-area-feature";

const style = { width: "100%", height: "100%" };

const MAX_BOUNDS: [number, number, number, number] = [
  -224.17459662506633, 30.196000914813084, -16.362485879322406, 75.22947015173992,
];

const FIT_PADDING = { top: 50, bottom: 50, left: 630, right: 50 };

export const MapView: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mapRef = useRef<MapRef>(null);
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const [popup, setPopup] = useAtom(popupAtom);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { data: areas, isPending, failureCount } = useAreas();
  const { data: matches, isFiltered } = useFilteredAreas();
  const [framedOnMount] = useState(isFiltered || params.areaId !== undefined);

  const areaBbox = params.areaId
    ? areas?.find((area) => area.id === params.areaId)?.bbox || null
    : null;
  const searchBbox = useMemo(
    () => (isFiltered && matches ? unionBbox(matches) : null),
    [isFiltered, matches],
  );
  // A box reaching past maxBounds (Arctic areas touch 85°N) can't be fitted, and the
  // camera clamp that follows pushes other matches out of view. A box wholly outside
  // clamps to null and leaves the camera alone.
  const targetBbox = useMemo(() => {
    const bbox = areaBbox ?? searchBbox;
    return bbox && clampBbox(bbox, MAX_BOUNDS);
  }, [areaBbox, searchBbox]);

  useEffect(() => {
    if (!targetBbox || !mapLoaded) return;
    mapRef.current?.fitBounds(targetBbox, { animate: true, padding: FIT_PADDING });
  }, [targetBbox, mapLoaded]);

  const handleClick = (evt: MapMouseEvent) => {
    const id = pickAreaFeature(evt.features ?? [])?.id;
    if (id !== undefined && id !== null) {
      navigate({ to: "/areas/$areaId", params: { areaId: String(id) } });
    }
  };

  const handleHover = (evt: MapMouseEvent) => {
    const feature = pickHoverFeature(evt.features ?? []);
    if (feature) {
      setPopup({ lngLat: evt.lngLat, ...feature });
    } else {
      setPopup(null);
    }
  };

  if (framedOnMount && isPending && failureCount === 0) return null;

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/crib2025/cmc9e61rp00a601sh2jgretdw"
      projection="mercator"
      maxBounds={MAX_BOUNDS}
      initialViewState={
        targetBbox
          ? { bounds: targetBbox, fitBoundsOptions: { padding: FIT_PADDING } }
          : { zoom: 1, bounds: MAX_BOUNDS }
      }
      interactiveLayerIds={["wdpa-layer", "bioregions-layer"]}
      onLoad={() => setMapLoaded(true)}
      onClick={handleClick}
      onMouseMove={handleHover}
    >
      <>
        {children}
        {popup && (
          <Popup longitude={popup.lngLat.lng} latitude={popup.lngLat.lat} closeButton={false}>
            <div className="text-sm text-center text-slate-600">
              {popup.properties?.name || popup.id}
            </div>
          </Popup>
        )}
      </>
    </ReactMapGL>
  );
};
