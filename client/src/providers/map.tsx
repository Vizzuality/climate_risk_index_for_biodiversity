import React from "react";
import { MapProvider as MapboxMapProvider } from "react-map-gl/mapbox";

export function MapProvider({ children }: { children: React.ReactNode }) {
  return <MapboxMapProvider>{children}</MapboxMapProvider>;
}
