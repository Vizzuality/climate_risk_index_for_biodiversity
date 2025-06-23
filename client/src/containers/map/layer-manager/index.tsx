"use client";

import WDPALayer from "@/containers/map/layers/wdpa";
import { useScenario } from "@/store";
import LowEmissionsLayer from "@/containers/map/layers/low-emissions";
import HighEmissionsLayer from "@/containers/map/layers/high-emissions";

export default function LayerManager() {
  const [scenario] = useScenario();

  return (
    <>
      <WDPALayer />
      {scenario === "high" && <HighEmissionsLayer />}
      {scenario === "low" && <LowEmissionsLayer />}
    </>
  );
}
