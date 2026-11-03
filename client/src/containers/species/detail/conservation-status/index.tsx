import { useId, useState } from "react";

import { ShowMoreButton } from "@/components/show-more-button";
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
import { type SarPopulation, type StatusCount, saraListing } from "@/lib/species-sar-status";
import { cn } from "@/lib/utils";

// The design's sara/* tags; COSEWIC uses the same tags.
const DATA_DEFICIENT = "bg-[#cbd3dc] text-[#0b1630]";
const NO_STATUS = "bg-slate-100 text-slate-700";
const STATUS_CLASSES: Record<string, string> = {
  Extinct: "bg-slate-700 text-white",
  Extirpated: "bg-[#a04545] text-white",
  Endangered: "bg-[#f0afad] text-[#8a2a0c]",
  Threatened: "bg-[#ffdcb7] text-[#924c01]",
  "Special Concern": "bg-[#efe5af] text-[#825309]",
  "Data Deficient": DATA_DEFICIENT,
  "Not at Risk": "bg-[#b5e2d1] text-[#184f26]",
  "Not listed": NO_STATUS,
  "Not assessed": NO_STATUS,
};

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] leading-4 font-semibold uppercase tracking-[1px] whitespace-nowrap",
        STATUS_CLASSES[status] ?? DATA_DEFICIENT,
      )}
    >
      {status}
    </span>
  );
}

// The statuses of a species' populations with how many have each; counts
// only when there are populations to count.
function StatusCounts({
  statuses,
  showCounts,
  emptyLabel,
}: Readonly<{ statuses: StatusCount[]; showCounts: boolean; emptyLabel: string }>) {
  return (
    <span className="flex flex-1 flex-wrap gap-x-2 gap-y-[3px]">
      {statuses.map(({ status, count }) => (
        <span key={status ?? ""} className="inline-flex items-center gap-1">
          <StatusBadge status={status ?? emptyLabel} />
          {showCounts && (
            <span className="text-[10px] leading-[14px] tabular-nums text-slate-700">
              <span aria-hidden className="inline-flex items-center gap-px">
                <span className="text-[6px]">X</span>
                {count}
              </span>
              <span className="sr-only">
                {count} {count === 1 ? "population" : "populations"}
              </span>
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function SaraStatus({ population }: Readonly<{ population: SarPopulation }>) {
  return <StatusBadge status={saraListing(population) ?? "Not listed"} />;
}

function PopulationRow({
  population,
  speciesName,
}: Readonly<{ population: SarPopulation; speciesName: string }>) {
  const isSubspecies = population.scientific_name !== speciesName;

  return (
    <TableRow>
      <TableCell className="whitespace-normal pl-0 text-slate-700">
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

  const { populations, cosewicStatuses, saraStatuses } = data;
  // A species assessed as a whole has a single row without a population; the
  // header rows say it all.
  const single = populations.length === 1 && !populations[0].population;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-8 items-center gap-1 py-1.5 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">COSEWIC status</span>
        {populations.length === 0 ? (
          <span className="flex-1">
            <StatusBadge status="Not assessed" />
          </span>
        ) : (
          <StatusCounts statuses={cosewicStatuses} showCounts={!single} emptyLabel="Not assessed" />
        )}
      </div>
      {populations.length > 0 && (
        <div className="flex min-h-8 items-center gap-1 py-1.5 border-b border-dashed border-b-slate-300 text-slate-600">
          <span className="flex-1 uppercase font-semibold text-xs">SARA status</span>
          <StatusCounts statuses={saraStatuses} showCounts={!single} emptyLabel="Not listed" />
        </div>
      )}
      {!single && populations.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.24px] text-slate-700">
            <p>Assessed as {populations.length} populations.</p>
            <ShowMoreButton
              expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Hide populations" : "Show all populations"}
            </ShowMoreButton>
          </div>
          <div id={listId} hidden={!expanded} className="mt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-0 text-xs uppercase text-slate-700">
                    Population
                  </TableHead>
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
