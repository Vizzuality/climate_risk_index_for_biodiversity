"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactMapGL from "react-map-gl/mapbox";

import type { MapRef } from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

const style = { width: "100%", height: "100%" };

const Map: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mapRef = useRef<MapRef>(null);
  const [map, setMap] = useState<MapRef | null>(null);

  // The inner map is memoized so that it doesn't rerender when the map is panned due to the bounds
  // changing
  const innerMap = useMemo(() => {
    // We make sure to render the layers when the map is ready
    if (!map) {
      return null;
    }

    return (
      <>
        {/* todo: implement layers here */}
        {/*<Controls />*/}
        {children}
      </>
    );
  }, [map, children]);

  const onLoad = useCallback(() => setMap(mapRef.current), [setMap]);

  return (
    <ReactMapGL
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={style}
      mapStyle="mapbox://styles/mapbox/dark-v10"
      projection="mercator"
      onLoad={onLoad}
      padding={{
        left: 630,
      }}
      initialViewState={{
        bounds: [
          [-71.03883885640943, 40.04343083174228],
          [-47.69751888944774, 60.99999999975432],
        ],
      }}
    >
      {innerMap}
    </ReactMapGL>
  );
};

export default Map;
