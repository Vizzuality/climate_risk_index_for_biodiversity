import { AreasSource } from "@/containers/map/layers/areas-source";
import { BioregionsLayer } from "@/containers/map/layers/bioregions";
import { DeckGLOverlay } from "@/components/map/deckgl-overlay";
import { BathymetryLayer } from "@/containers/map/layers/bathymetry";
import { climateRiskRasterLayers } from "@/containers/map/layers/climate-risk-raster";
import { useSpeciesRiskRasterLayers } from "@/containers/map/layers/species-risk-raster";
import { WDPALayer } from "@/containers/map/layers/wdpa";
import { useParams } from "@tanstack/react-router";
import type { MapLayer } from "@/lib/map-layers";
import { useLayerSettings, useScenario } from "@/store";

export default function LayerManager() {
  const [scenario] = useScenario();
  const { speciesId } = useParams({ strict: false });
  const { isVisible, opacity } = useLayerSettings();
  const settings = (layer: MapLayer) => ({
    visible: isVisible(layer),
    opacity: opacity(layer) / 100,
  });

  const speciesRasters = useSpeciesRiskRasterLayers({
    speciesId: speciesId === undefined ? undefined : Number(speciesId),
    scenario,
    ...settings("species"),
  });
  // One overlay for every raster: interleaved overlays group layers by beforeId
  // into a Mapbox layer whose id would clash between two overlays. The species
  // raster comes last so it draws on top.
  const rasters = [
    ...climateRiskRasterLayers({ scenario, ...settings("risk") }),
    ...speciesRasters,
  ];

  return (
    <>
      <AreasSource>
        <BioregionsLayer {...settings("bioregions")} />
        <WDPALayer {...settings("areas")} />
      </AreasSource>
      <BathymetryLayer {...settings("bathymetry")} />
      <DeckGLOverlay layers={rasters} interleaved />
    </>
  );
}
