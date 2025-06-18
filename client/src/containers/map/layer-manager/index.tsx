"use client";

import WDPALayer from "@/containers/map/layers/wdpa";

export default function LayerManager() {
  // const [scenario] = useScenario();

  return (
    <>
      {/*{scenario === "high" && <HighEmissionsLayer />}*/}
      {/*{scenario === "low" && <LowEmissionsLayer />}*/}
      <WDPALayer />
    </>
  );
}
