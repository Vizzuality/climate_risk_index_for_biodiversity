import WDPALayer from "@/containers/map/layers/wdpa";
import { useScenario } from "@/store";
import AtlanticBioregionsLayer from "@/containers/map/layers/atlantic-bioregions";
import { ClimateRiskRasterLayer } from "@/containers/map/layers/climate-risk-raster";

export default function LayerManager() {
  const [scenario] = useScenario();

  return (
    <>
      <WDPALayer />
      <AtlanticBioregionsLayer />
      <ClimateRiskRasterLayer scenario={scenario} />
    </>
  );
}
