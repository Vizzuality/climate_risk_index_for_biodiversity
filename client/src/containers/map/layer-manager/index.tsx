import { AreasSource } from "@/containers/map/layers/areas-source";
import { BioregionsLayer } from "@/containers/map/layers/bioregions";
import { ClimateRiskRasterLayer } from "@/containers/map/layers/climate-risk-raster";
import { WDPALayer } from "@/containers/map/layers/wdpa";
import { useContextualLayers, useScenario } from "@/store";

export default function LayerManager() {
  const [scenario] = useScenario();
  const [visibleLayers] = useContextualLayers();

  return (
    <>
      <AreasSource>
        <BioregionsLayer visible={visibleLayers.includes("bioregions")} />
        <WDPALayer visible={visibleLayers.includes("areas")} />
      </AreasSource>
      <ClimateRiskRasterLayer scenario={scenario} visible={visibleLayers.includes("risk")} />
    </>
  );
}
