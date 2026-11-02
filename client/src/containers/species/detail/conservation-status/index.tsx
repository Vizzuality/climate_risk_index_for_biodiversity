import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSpeciesSarStatus } from "@/hooks/use-species-sar-status";
import { type SarPopulation, saraListing } from "@/lib/species-sar-status";
import { cn } from "@/lib/utils";

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

function SaraStatus({ population }: Readonly<{ population: SarPopulation }>) {
  const sara = saraListing(population);
  return sara ? <StatusBadge status={sara} /> : <span className="text-slate-500">Not listed</span>;
}

function PopulationRow({
  population,
  speciesName,
}: Readonly<{ population: SarPopulation; speciesName: string }>) {
  const isSubspecies = population.scientific_name !== speciesName;

  return (
    <TableRow>
      <TableCell className="whitespace-normal text-slate-700">
        {population.population && <p>{population.population}</p>}
        {isSubspecies && <p className="italic text-slate-600">{population.scientific_name}</p>}
        {population.cosewic_assessed && (
          <p className="text-xs text-slate-500">Assessed {population.cosewic_assessed}</p>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={population.cosewic_status} />
      </TableCell>
      <TableCell>
        <SaraStatus population={population} />
      </TableCell>
    </TableRow>
  );
}

export default function ConservationStatus({
  speciesId,
  scientificName,
}: Readonly<{ speciesId: number; scientificName: string }>) {
  const { data, isPending, isError } = useSpeciesSarStatus(speciesId);
  // Salmon have around 30 populations, so the list starts collapsed.
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  if (isPending) return <Skeleton className="h-10 w-full" />;
  if (isError) {
    return <p className="text-sm text-slate-500">The conservation status couldn’t be loaded.</p>;
  }

  const { populations, status } = data;
  // A species assessed as a whole has a single row without a population; it
  // fits in the header row.
  const single = populations.length === 1 && !populations[0].population;

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
          <span className="flex-1 text-sm">
            <SaraStatus population={populations[0]} />
          </span>
        </div>
      )}
      {!single && populations.length > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-4 text-sm text-slate-500">
            <p>Assessed as {populations.length} populations, most at risk first.</p>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded(!expanded)}
              className="inline-flex shrink-0 items-center gap-0.5 text-slate-700 underline underline-offset-2 hover:text-slate-900"
            >
              {expanded ? "Hide populations" : "Show all populations"}
              <ChevronDown
                aria-hidden
                className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              />
            </button>
          </div>
          <div id={listId} hidden={!expanded}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase text-slate-700">Population</TableHead>
                  <TableHead className="text-xs uppercase text-slate-700">COSEWIC</TableHead>
                  <TableHead className="text-xs uppercase text-slate-700">SARA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {populations.map((population) => (
                  <PopulationRow
                    key={`${population.scientific_name}-${population.population}`}
                    population={population}
                    speciesName={scientificName}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
