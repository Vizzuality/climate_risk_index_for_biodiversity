import { useMemo } from "react";
import type { ExpressionSpecification } from "mapbox-gl";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { PROTECTION_TYPES } from "@/lib/protection-types";

const AREA_ID = ["to-string", ["get", "id"]];

const CORE_LINE_COLOR = "#1e3152";

const TYPE_COLOR = [
  "match",
  ["get", "layer_type"],
  ...PROTECTION_TYPES.flatMap((type) => [type.layerType, type.color]),
  CORE_LINE_COLOR,
] as ExpressionSpecification;

export const WDPALayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const layout = { visibility: visible ? "visible" : "none" } as const;
  const { areaId } = useParams({ strict: false });
  const { data: matches, isFiltered } = useFilteredAreas();

  const selected = useMemo((): Pick<LayerProps, "filter"> => {
    if (areaId) return { filter: ["==", AREA_ID, areaId] };
    if (isFiltered && matches)
      return { filter: ["in", AREA_ID, ["literal", matches.map((a) => a.id)]] };
    return {};
  }, [areaId, isFiltered, matches]);

  return (
    <>
      <Layer
        id="wdpa-layer"
        type="fill"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "fill-color": "transparent",
          "fill-outline-color": "#EAF3ED",
          "fill-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": CORE_LINE_COLOR,
          "line-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-left"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": TYPE_COLOR,
          "line-offset": -1,
          "line-opacity": opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline-right"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId="maritimes-region-b5kyh8"
        paint={{
          "line-color": TYPE_COLOR,
          "line-offset": 1,
          "line-opacity": opacity,
        }}
        {...selected}
      />
    </>
  );
};
