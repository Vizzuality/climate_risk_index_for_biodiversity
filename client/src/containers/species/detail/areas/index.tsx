import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";

import { ScenarioScores } from "@/components/scenario-scores";
import { ShowMoreButton } from "@/components/show-more-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAreas } from "@/hooks/use-areas";
import { useSpeciesAreas } from "@/hooks/use-species-areas";
import { formatAreaName } from "@/lib/area-name";
import { withScenarioScores } from "@/lib/scenario-scores";
import { filterAreasByName, withAreaNames } from "@/lib/species-areas";
import { cn } from "@/lib/utils";
import { useScenario } from "@/store";

const COLUMN_LABEL =
  "h-auto pb-2 text-xs leading-4 font-semibold uppercase tracking-[1.2px] text-slate-700";

// Widespread species are in hundreds of areas; the rest are behind "Show all".
const COLLAPSED_ROWS = 10;

type AreasSearchProps = Readonly<{
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  query: string;
  onQueryChange: (query: string) => void;
}>;

function AreasSearch({ isPending, isError, isEmpty, query, onQueryChange }: AreasSearchProps) {
  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError) return <p className="text-sm text-slate-500">The areas couldn’t be loaded.</p>;
  if (isEmpty) return <p className="text-sm text-slate-500">No areas for this scenario.</p>;

  return (
    <div className="relative">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500"
      />
      <Input
        type="search"
        aria-label="Search areas by name"
        placeholder="Search areas by name"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="h-10 w-full rounded-[4px] border-slate-300 pl-10 shadow-none placeholder:text-slate-500"
      />
    </div>
  );
}

export default function SpeciesAreas({ speciesId }: Readonly<{ speciesId: number }>) {
  const [scenario] = useScenario();
  const { data, isPending, isError } = useSpeciesAreas(speciesId);
  const { data: allAreas, isPending: areasPending, isError: areasError } = useAreas();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const areas = useMemo(
    () =>
      withAreaNames(data ? withScenarioScores(data, scenario, ({ id }) => id) : [], allAreas ?? []),
    [data, scenario, allAreas],
  );
  const matches = filterAreasByName(areas, deferredQuery);
  const rows = expanded ? matches : matches.slice(0, COLLAPSED_ROWS);

  return (
    <section className="space-y-4">
      <h3 className="text-slate-700 font-semibold text-[20px]">
        Conservation areas with the species
      </h3>
      <p className="text-slate-700">
        The conservation areas the species is found in, ranked by its mean climate risk within each
        area.
      </p>
      <AreasSearch
        isPending={isPending || areasPending}
        isError={isError || areasError}
        isEmpty={areas.length === 0}
        query={query}
        onQueryChange={setQuery}
      />
      {areas.length > 0 &&
        (matches.length === 0 ? (
          <p className="text-sm text-slate-500">No areas match “{deferredQuery.trim()}”.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Table>
              <TableHeader className="[&_tr]:border-0">
                <TableRow>
                  <TableHead className={cn(COLUMN_LABEL, "pl-0")}>Conservation area</TableHead>
                  <TableHead className={cn(COLUMN_LABEL, "pr-0 text-right")}>
                    Climate risk index (low / high)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ id, name, scores }) => (
                  <TableRow key={id}>
                    <TableCell className="whitespace-normal pl-0 text-slate-700">
                      <Link to="/areas/$areaId" params={{ areaId: id }} className="hover:underline">
                        {formatAreaName(name)}
                      </Link>
                    </TableCell>
                    <TableCell className="pr-0">
                      <ScenarioScores scores={scores} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {matches.length > COLLAPSED_ROWS && (
              <ShowMoreButton expanded={expanded} onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show fewer" : `Show all ${matches.length} areas`}
              </ShowMoreButton>
            )}
          </div>
        ))}
    </section>
  );
}
