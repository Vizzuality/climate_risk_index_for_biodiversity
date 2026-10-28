import { useMemo } from "react";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { BASEMAP_BOUNDARIES_LAYER_ID } from "@/lib/map-layers";
import { PROTECTION_TYPES } from "@/lib/protection-types";

const AREA_ID = ["to-string", ["get", "id"]];

const GOVERNANCE_TYPE_COLOR = [
  "match",
  ["get", "governance_type"],
  ...PROTECTION_TYPES.flatMap((type) => [type.governanceType, type.color]),
  "transparent",
] as ExpressionSpecification;

const AREA_FILL_OPACITY = 0.12;

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
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "fill-color": GOVERNANCE_TYPE_COLOR,
          "fill-opacity": AREA_FILL_OPACITY * opacity,
        }}
        {...selected}
      />

      <Layer
        id="wdpa-layer-outline"
        type="line"
        source-layer={AREAS_SOURCE_LAYER}
        source={AREAS_SOURCE_ID}
        layout={layout}
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": GOVERNANCE_TYPE_COLOR,
          "line-width": 1.5,
          "line-opacity": opacity,
        }}
        {...selected}
      />
    </>
  );
};
