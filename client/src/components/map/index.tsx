"use client";

import { useRef } from "react";
import ReactMapGL from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";
import { LngLatBoundsLike, MapMouseEvent } from "mapbox-gl";
import { useParams, useRouter } from "next/navigation";

import data from "@/data/wdpa.json";
import { Area } from "@/containers/main/table/columns";

const style = { width: "100%", height: "100%" };

const DEFAULT_BOUNDS: LngLatBoundsLike = [
  [-71.03883885640943, 40.04343083174228],
  [-47.69751888944774, 60.99999999975432],
];

const Map: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mapRef = useRef<MapRef>(null);
  const router = useRouter();
  const params = useParams<{ area: string }>();

  const areaBbox =
    typeof window !== "undefined"
      ? (data as Area[]).find(
          (area) => area.name_en === window.decodeURIComponent(params.area),
        )?.bbox || null
      : null;

  const handleClick = (evt: MapMouseEvent) => {
    if (evt.features) {
      const feature = evt.features[0];
      if (feature?.layer?.id === "wdpa-layer") {
        const name = feature.id;
        router.push(`/${name}`);
      }
    }
  };

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/mapbox/dark-v10"
      projection="mercator"
      initialViewState={{
        bounds: areaBbox
          ? [
              [areaBbox[0], areaBbox[1]],
              [areaBbox[2], areaBbox[3]],
            ]
          : DEFAULT_BOUNDS,
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
      interactiveLayerIds={["wdpa-layer"]}
      onClick={handleClick}
    >
      {children}
    </ReactMapGL>
  );
};

export default Map;
