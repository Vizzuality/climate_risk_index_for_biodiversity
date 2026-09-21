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
        {/* Mount order is stacking order: bioregion outlines follow the same
            coastlines as the areas and would wash them out if drawn on top. */}
        <BioregionsLayer />
        <WDPALayer />
      </AreasSource>
      <ClimateRiskRasterLayer scenario={scenario} />
    </>
  );
}
