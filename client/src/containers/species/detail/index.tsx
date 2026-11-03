import { Link } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import ClimateRiskChart from "@/containers/detail/climate-risk-chart";
import ConservationStatus from "@/containers/species/detail/conservation-status";
import SpeciesAreas from "@/containers/species/detail/areas";
import Intro from "@/containers/species/detail/intro";
import SpeciesStats from "@/containers/species/detail/stats";
import { useSelectedSpecies } from "@/hooks/use-selected-species";

export default function SpeciesDetail() {
  const { data: species, isLoading } = useSelectedSpecies();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!species) {
    return (
      <div className="space-y-4 text-slate-600">
        <p>This species couldn’t be found.</p>
        <Link to="/species" className="text-sm text-slate-700 underline">
          Back to all species
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Intro species={species} />
      <SpeciesStats species={species} />
      {/* Keyed so "Show all" resets when another species opens */}
      <ConservationStatus
        key={`${species.id}-status`}
        speciesId={species.id}
        scientificName={species.scientific_name}
      />
      <ClimateRiskChart indicator={species.indicator} />
      {/* Keyed so the search and "Show all" reset when another species opens */}
      <SpeciesAreas key={`${species.id}-areas`} speciesId={species.id} />
    </div>
  );
}
