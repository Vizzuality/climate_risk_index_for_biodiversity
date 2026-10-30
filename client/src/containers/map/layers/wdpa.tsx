import { useMemo } from "react";
import { Layer, type LayerProps } from "react-map-gl/mapbox";
import type { ExpressionSpecification, FilterSpecification } from "mapbox-gl";
import { useParams } from "@tanstack/react-router";
import { AREAS_SOURCE_ID, AREAS_SOURCE_LAYER } from "@/containers/map/layers/areas-source";
import { useFilteredAreas } from "@/hooks/use-filtered-areas";
import { BASEMAP_BOUNDARIES_LAYER_ID } from "@/lib/map-layers";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import { useHiddenAreaTypes } from "@/store";

const AREA_ID = ["to-string", ["get", "id"]];

const governanceTypeMatch = (key: "color" | "fillColor") =>
  [
    "match",
    ["get", "governance_type"],
    ...PROTECTION_TYPES.flatMap((type) => [type.governanceType, type[key]]),
    "transparent",
  ] as ExpressionSpecification;

const GOVERNANCE_TYPE_LINE_COLOR = governanceTypeMatch("color");
const GOVERNANCE_TYPE_FILL_COLOR = governanceTypeMatch("fillColor");

export const WDPALayer = ({
  visible,
  opacity,
}: Readonly<{ visible: boolean; opacity: number }>) => {
  const layout = { visibility: visible ? "visible" : "none" } as const;
  const { areaId } = useParams({ strict: false });
  const { data: matches, isFiltered } = useFilteredAreas();
  const [hiddenTypes] = useHiddenAreaTypes();

  const selected = useMemo((): Pick<LayerProps, "filter"> => {
    const filters: FilterSpecification[] = [];
    if (areaId) filters.push(["==", AREA_ID, areaId]);
    else if (isFiltered && matches)
      filters.push(["in", AREA_ID, ["literal", matches.map((a) => a.id)]]);
    if (hiddenTypes.length) {
      const hidden = PROTECTION_TYPES.filter((type) => hiddenTypes.includes(type.value));
      filters.push([
        "!",
        ["in", ["get", "governance_type"], ["literal", hidden.map((type) => type.governanceType)]],
      ]);
    }
    if (filters.length === 0) return {};
    return { filter: filters.length === 1 ? filters[0] : ["all", ...filters] };
  }, [areaId, isFiltered, matches, hiddenTypes]);

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
          "fill-color": GOVERNANCE_TYPE_FILL_COLOR,
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
        beforeId={BASEMAP_BOUNDARIES_LAYER_ID}
        paint={{
          "line-color": GOVERNANCE_TYPE_LINE_COLOR,
          "line-width": 1.5,
          "line-opacity": opacity,
        }}
        {...selected}
      />
    </>
  );
};
