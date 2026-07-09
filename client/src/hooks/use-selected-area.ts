import * as React from "react";

import areas from "@/data/wdpa.json";
import { useParams } from "@tanstack/react-router";
import { Area } from "@/containers/main/table/columns";

export function useSelectedArea() {
  const params = useParams({ strict: false });
  const areaId = params.area;

  return React.useMemo(() => {
    if (!areaId) return null;

    return (areas as Area[]).find((a) => a.name_en === areaId) || null;
  }, [areaId]);
}
