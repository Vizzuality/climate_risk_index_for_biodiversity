"use client";

import WDPALayer from "@/containers/map/layers/wdpa";
import { useScenario } from "@/store";
import LowEmissionsLayer from "@/containers/map/layers/low-emissions";
import HighEmissionsLayer from "@/containers/map/layers/high-emissions";
import AtlanticBioregionsLayer from "@/containers/map/layers/atlantic-bioregions";

export default function LayerManager() {
  const [scenario] = useScenario();

  return (
    <>
      <WDPALayer />
      <AtlanticBioregionsLayer />
      {scenario === "high" && <HighEmissionsLayer />}
      {scenario === "low" && <LowEmissionsLayer />}
    </>
  );
}
