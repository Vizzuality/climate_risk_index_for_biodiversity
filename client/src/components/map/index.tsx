"use client";

import { useRef } from "react";
import ReactMapGL from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import { LngLatBoundsLike, MapMouseEvent } from "mapbox-gl";
import { useParams, useRouter } from "next/navigation";

import data from "@/data/wdpa.json";
import { Area } from "@/containers/main/table/columns";
import { useAtom } from "jotai";
import { popupAtom } from "@/store";
import { Popup } from "react-map-gl/mapbox";

const style = { width: "100%", height: "100%" };

const MAX_BOUNDS: LngLatBoundsLike = [
  -224.17459662506633, 30.196000914813084, -16.362485879322406,
  75.22947015173992,
];

const Map: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mapRef = useRef<MapRef>(null);
  const router = useRouter();
  const params = useParams<{ area: string }>();
  const [popup, setPopup] = useAtom(popupAtom);

  const areaBbox =
    typeof window !== "undefined"
      ? (data as Area[]).find(
          (area) => area.name_en === window.decodeURIComponent(params.area),
        )?.bbox || null
      : null;

  const handleClick = (evt: MapMouseEvent) => {
    if (evt.features) {
      const feature = evt.features[evt.features.length - 1];
      if (feature?.layer?.id === "wdpa-layer") {
        const name = feature.id;
        router.push(`/${name}`);
      }
    }
  };

  const handleHover = (evt: MapMouseEvent) => {
    if (evt.features?.length) {
      const feature = evt.features[evt.features.length - 1];
      if (
        ["wdpa-layer", "atlantic-bioregions-layer"].includes(
          feature?.layer?.id ?? "",
        )
      ) {
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
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/crib2025/cmc9e61rp00a601sh2jgretdw"
      projection="mercator"
      maxBounds={MAX_BOUNDS}
      initialViewState={{
        zoom: 1,
        bounds: areaBbox
          ? [
              [areaBbox[0], areaBbox[1]],
              [areaBbox[2], areaBbox[3]],
            ]
          : MAX_BOUNDS,
        fitBoundsOptions: {
          ...(areaBbox && {
            padding: {
              top: 50,
              bottom: 50,
              left: 630,
              right: 50,
            },
          }),
        },
      }}
      interactiveLayerIds={["wdpa-layer", "atlantic-bioregions-layer"]}
      onClick={handleClick}
      onMouseMove={handleHover}
    >
      <>
        {children}
        {popup && (
          <Popup
            longitude={popup.lngLat.lng}
            latitude={popup.lngLat.lat}
            closeButton={false}
          >
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
