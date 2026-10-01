import * as React from "react";

import { useAreas } from "@/hooks/use-areas";
import { useParams } from "@tanstack/react-router";

export function useSelectedArea() {
  const params = useParams({ strict: false });
  const { data: areas } = useAreas();
  const areaId = params.areaId;

  return React.useMemo(() => {
    if (!areaId) return null;

    return areas?.find((a) => a.id === areaId) || null;
  }, [areaId, areas]);
}
