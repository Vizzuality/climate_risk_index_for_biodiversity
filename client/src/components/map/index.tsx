import { useEffect, useRef, useState } from "react";
import ReactMapGL, { Popup } from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import { LngLatBoundsLike, MapMouseEvent } from "mapbox-gl";
import { useNavigate, useParams } from "@tanstack/react-router";

import { useAreas } from "@/hooks/use-areas";
import { useAtom } from "jotai";
import { popupAtom } from "@/store";

const style = { width: "100%", height: "100%" };

const MAX_BOUNDS: LngLatBoundsLike = [
  -224.17459662506633, 30.196000914813084, -16.362485879322406, 75.22947015173992,
];

const Map: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mapRef = useRef<MapRef>(null);
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const [popup, setPopup] = useAtom(popupAtom);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { data: areas } = useAreas();

  const areaBbox = params.area
    ? areas?.find((area) => area.name_en === params.area)?.bbox || null
    : null;

  // areas load async, so the selected-area viewport can't be an initialViewState;
  // this also makes the map follow route changes from the table and map clicks.
  // Gated on the map's load event — camera calls before it are dropped.
  useEffect(() => {
    if (!areaBbox || !mapLoaded) return;
    mapRef.current?.fitBounds(
      [
        [areaBbox[0], areaBbox[1]],
        [areaBbox[2], areaBbox[3]],
      ],
      {
        animate: true,
        padding: { top: 50, bottom: 50, left: 630, right: 50 },
      },
    );
  }, [areaBbox, mapLoaded]);

  const handleClick = (evt: MapMouseEvent) => {
    if (evt.features) {
      const feature = evt.features[evt.features.length - 1];
      if (feature?.layer?.id === "wdpa-layer") {
        const name = feature.id;
        if (name) {
          navigate({ to: "/$area", params: { area: String(name) } });
        }
      }
    }
  };

  const handleHover = (evt: MapMouseEvent) => {
    if (evt.features?.length) {
      const feature = evt.features[evt.features.length - 1];
      if (["wdpa-layer", "atlantic-bioregions-layer"].includes(feature?.layer?.id ?? "")) {
        setPopup({
          lngLat: evt.lngLat,
          ...feature,
        });
      }
    } else {
      setPopup(null);
    }
  };

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/crib2025/cmc9e61rp00a601sh2jgretdw"
      projection="mercator"
      maxBounds={MAX_BOUNDS}
      initialViewState={{
        zoom: 1,
        bounds: MAX_BOUNDS,
      }}
      interactiveLayerIds={["wdpa-layer", "atlantic-bioregions-layer"]}
      onLoad={() => setMapLoaded(true)}
      onClick={handleClick}
      onMouseMove={handleHover}
    >
      <>
        {children}
        {popup && (
          <Popup longitude={popup.lngLat.lng} latitude={popup.lngLat.lat} closeButton={false}>
            <div className="text-sm text-center text-slate-600">
              {popup.properties?.name_en || popup.id}
            </div>
          </Popup>
        )}
      </>
    </ReactMapGL>
  );
};

export default Map;
