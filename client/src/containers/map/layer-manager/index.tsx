import { AreasSource } from "@/containers/map/layers/areas-source";
import { BioregionsLayer } from "@/containers/map/layers/bioregions";
import { ClimateRiskRasterLayer } from "@/containers/map/layers/climate-risk-raster";
import { WDPALayer } from "@/containers/map/layers/wdpa";
import type { MapLayer } from "@/lib/map-layers";
import { useLayerSettings, useScenario } from "@/store";

export default function LayerManager() {
  const [scenario] = useScenario();
  const { isVisible, opacity } = useLayerSettings();
  const settings = (layer: MapLayer) => ({
    visible: isVisible(layer),
    opacity: opacity(layer) / 100,
  });

  return (
    <>
      <AreasSource>
        <BioregionsLayer {...settings("bioregions")} />
        <WDPALayer {...settings("areas")} />
      </AreasSource>
      <ClimateRiskRasterLayer scenario={scenario} {...settings("risk")} />
    </>
  );
}
