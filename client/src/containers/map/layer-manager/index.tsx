import { AreasSource } from "@/containers/map/layers/areas-source";
import { BioregionsLayer } from "@/containers/map/layers/bioregions";
import { ClimateRiskRasterLayer } from "@/containers/map/layers/climate-risk-raster";
import { WDPALayer } from "@/containers/map/layers/wdpa";
import { useScenario } from "@/store";

export default function LayerManager() {
  const [scenario] = useScenario();

  return (
    <>
      <AreasSource>
        <WDPALayer />
        <BioregionsLayer />
      </AreasSource>
      <ClimateRiskRasterLayer scenario={scenario} />
    </>
  );
}
