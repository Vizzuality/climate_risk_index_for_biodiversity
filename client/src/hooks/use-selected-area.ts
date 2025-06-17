import * as React from "react";

import areas from "@/data/areas_old";
import { useParams } from "next/navigation";

export function useSelectedArea() {
  const params = useParams();
  const areaId = params.area as string;

  return React.useMemo(() => {
    if (!areaId || typeof window === "undefined") return null;

    return (
      areas.find((a) => a.name_en === window.decodeURIComponent(areaId)) || null
    );
  }, [areaId]);
}
