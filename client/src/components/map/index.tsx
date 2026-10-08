import { useEffect, useMemo, useRef, useState } from "react";
import ReactMapGL, { Popup } from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import type { MapEvent, MapMouseEvent } from "mapbox-gl";
import { useNavigate, useParams } from "@tanstack/react-router";

import { useAreas } from "@/hooks/use-areas";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { clampBbox, unionBbox } from "@/lib/bbox";
import { useAtom } from "jotai";
import { mapCursorAtom, popupAtom, useMapBbox } from "@/store";
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
  const [cursor, setCursor] = useAtom(mapCursorAtom);
  const { data: areas, isPending, failureCount } = useAreas();
  const { data: matches, isFiltered } = useFilteredAreas();
  const [framedOnMount] = useState(isFiltered || params.areaId !== undefined);
  const [urlBbox, setUrlBbox] = useMapBbox();
  const [sharedBbox] = useState(() => urlBbox && clampBbox(urlBbox, MAX_BOUNDS));

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

  // The box the camera shows: the map opens on the initial target box, so refitting it on
  // load would replay the same view as an animation.
  const fittedBbox = useRef(targetBbox);

  useEffect(() => {
    if (!targetBbox || !mapLoaded || targetBbox === fittedBbox.current) return;
    fittedBbox.current = targetBbox;
    mapRef.current?.fitBounds(targetBbox, { animate: true, padding: FIT_PADDING });
  }, [targetBbox, mapLoaded]);

  // With terrain on, Mapbox draws custom layers after every draped style layer, which lifts the
  // deck raster above the area outlines whatever its beforeId. The map stays flat and north-up;
  // react-map-gl only toggles whole handlers, so pinch and keyboard rotation are turned off here.
  const handleLoad = (evt: MapEvent) => {
    evt.target.setTerrain(null);
    evt.target.touchZoomRotate.disableRotation();
    evt.target.keyboard.disableRotation();
    fittedBbox.current = targetBbox;
    setMapLoaded(true);
  };

  // Measured on the padded frame the fits use, so a shared box reopens beside the sidebar.
  // getBounds() can't be used: it follows whatever padding the last fit left on the camera.
  const handleMoveEnd = (evt: MapEvent) => {
    const map = evt.target;
    const { clientWidth, clientHeight } = map.getCanvas();
    const right = clientWidth - FIT_PADDING.right;
    const bottom = clientHeight - FIT_PADDING.bottom;
    if (right <= FIT_PADDING.left || bottom <= FIT_PADDING.top) return;
    const northWest = map.unproject([FIT_PADDING.left, FIT_PADDING.top]);
    const southEast = map.unproject([right, bottom]);
    setUrlBbox([northWest.lng, southEast.lat, southEast.lng, northWest.lat]);
  };

  const handleClick = (evt: MapMouseEvent) => {
    const id = pickAreaFeature(evt.features ?? [])?.id;
    if (id !== undefined && id !== null) {
      navigate({ to: "/areas/$areaId", params: { areaId: String(id) } });
    }
  };

  const handleHover = (evt: MapMouseEvent) => {
    // Only areas open on click; a held button means a drag, which owns the cursor.
    if (evt.originalEvent.buttons === 0) {
      setCursor(pickAreaFeature(evt.features ?? []) ? "pointer" : undefined);
    }
    const feature = pickHoverFeature(evt.features ?? []);
    if (feature) {
      setPopup({ lngLat: evt.lngLat, ...feature });
    } else {
      setPopup(null);
    }
  };

  if (framedOnMount && isPending && failureCount === 0) return null;

  const initialBbox = sharedBbox ?? targetBbox;

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/a-irvine/cmf43ty13003l01qscdneh6wp"
      projection="mercator"
      maxBounds={MAX_BOUNDS}
      maxPitch={0}
      dragRotate={false}
      touchPitch={false}
      initialViewState={
        initialBbox
          ? { bounds: initialBbox, fitBoundsOptions: { padding: FIT_PADDING } }
          : { zoom: 1, bounds: MAX_BOUNDS }
      }
      interactiveLayerIds={["wdpa-layer", "bioregions-layer"]}
      cursor={cursor}
      onLoad={handleLoad}
      onMoveEnd={handleMoveEnd}
      onClick={handleClick}
      onMouseMove={handleHover}
      onDragStart={() => setCursor("grabbing")}
      onDragEnd={() => setCursor(undefined)}
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
