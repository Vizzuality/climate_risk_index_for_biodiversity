import * as React from "react";

import areas from "@/data/areas";
import { useParams } from "next/navigation";

export function useSelectedArea() {
  const params = useParams();
  const areaId = params.area as string;
  console.log(areaId);

  return React.useMemo(() => {
    if (!areaId) return null;
    const area = areas.find((a) => a.id === areaId);
    return area || null;
  }, [areaId]);
}
