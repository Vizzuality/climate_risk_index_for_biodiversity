import * as React from "react";

import areas from "@/data/wdpa.json";
import { useParams } from "next/navigation";
import { Area } from "@/containers/main/table/columns";

export function useSelectedArea() {
  const params = useParams();
  const areaId = params.area as string;

  return React.useMemo(() => {
    if (!areaId || typeof window === "undefined") return null;

    return (
      (areas as Area[]).find(
        (a) => a.name_en === window.decodeURIComponent(areaId),
      ) || null
    );
  }, [areaId]);
}
