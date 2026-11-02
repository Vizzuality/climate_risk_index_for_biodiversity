import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpeciesSarStatus } from "@/hooks/use-species-sar-status";
import { type SarPopulation, saraListing } from "@/lib/species-sar-status";
import { cn } from "@/lib/utils";

// Salmon have around 30 populations; the rest are behind "Show all".
const COLLAPSED_ROWS = 5;

// Kept apart from the climate risk colors so the two scales don't read as one.
const STATUS_CLASSES: Record<string, string> = {
  Extinct: "bg-slate-800 text-white",
  Extirpated: "bg-slate-600 text-white",
  Endangered: "bg-red-100 text-red-800",
  Threatened: "bg-orange-100 text-orange-800",
  "Special Concern": "bg-amber-100 text-amber-800",
  "Data Deficient": "bg-slate-100 text-slate-600",
  "Not at Risk": "bg-emerald-100 text-emerald-800",
};

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_CLASSES[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  );
}

function PopulationStatus({
  population,
  speciesName,
}: Readonly<{ population: SarPopulation; speciesName: string }>) {
  const sara = saraListing(population);
  const isSubspecies = population.scientific_name !== speciesName;

  return (
    <li className="flex items-start gap-2 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
      <div className="flex-1 min-w-0">
        {population.population && <p className="text-slate-700">{population.population}</p>}
        {isSubspecies && <p className="italic">{population.scientific_name}</p>}
        <p className="text-xs text-slate-500">
          {sara ? `SARA Schedule 1: ${sara}` : "Not listed under SARA"}
          {population.cosewic_assessed && ` · COSEWIC assessed ${population.cosewic_assessed}`}
        </p>
      </div>
      <StatusBadge status={population.cosewic_status} />
    </li>
  );
}

export default function ConservationStatus({
  speciesId,
  scientificName,
}: Readonly<{ speciesId: number; scientificName: string }>) {
  const { data, isPending, isError } = useSpeciesSarStatus(speciesId);
  const [expanded, setExpanded] = useState(false);

  if (isPending) return <Skeleton className="h-10 w-full" />;
  if (isError) {
    return <p className="text-sm text-slate-500">The conservation status couldn’t be loaded.</p>;
  }

  const { populations, status } = data;
  // A species assessed as a whole has a single row without a population; it
  // fits in the header row.
  const single = populations.length === 1 && !populations[0].population;
  const rows = expanded ? populations : populations.slice(0, COLLAPSED_ROWS);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">COSEWIC status</span>
        <span className="flex-1">
          {status ? <StatusBadge status={status} /> : <span className="text-sm">Not assessed</span>}
        </span>
      </div>
      {single && (
        <div className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
          <span className="flex-1 uppercase font-semibold text-xs">SARA status</span>
          <span className="flex-1 text-sm">{saraListing(populations[0]) ?? "Not listed"}</span>
        </div>
      )}
      {!single && populations.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            Assessed as {populations.length} populations, most at risk first.
          </p>
          <ul>
            {rows.map((population) => (
              <PopulationStatus
                key={`${population.scientific_name}-${population.population}`}
                population={population}
                speciesName={scientificName}
              />
            ))}
          </ul>
          {populations.length > COLLAPSED_ROWS && (
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show fewer" : `Show all ${populations.length} populations`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
