import * as React from "react";

import { useAreas } from "@/hooks/use-areas";
import { useParams } from "@tanstack/react-router";

export function useSelectedArea() {
  const params = useParams({ strict: false });
  const { data: areas } = useAreas();
  const areaId = params.area;

  return React.useMemo(() => {
    if (!areaId) return null;

    return areas?.find((a) => a.name_en === areaId) || null;
  }, [areaId, areas]);
}
