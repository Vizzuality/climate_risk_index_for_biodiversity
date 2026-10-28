import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";

import { ScenarioScores } from "@/components/scenario-scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useAreas } from "@/hooks/use-areas";
import { useSpeciesAreas } from "@/hooks/use-species-areas";
import { withScenarioScores } from "@/lib/scenario-scores";
import { filterAreasByName, withAreaNames } from "@/lib/species-areas";
import { useScenario } from "@/store";

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
          <Table>
            <TableBody>
              {rows.map(({ id, name, scores }) => (
                <TableRow key={id}>
                  <TableCell className="whitespace-normal text-slate-700">
                    <Link to="/areas/$areaId" params={{ areaId: id }} className="hover:underline">
                      {name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ScenarioScores scores={scores} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <span className="sr-only">Conservation area</span>
                </TableHead>
                <TableHead className="text-xs uppercase text-slate-700 text-right">
                  CRIB risk index
                </TableHead>
              </TableRow>
            </TableFooter>
          </Table>
        ))}
      {matches.length > COLLAPSED_ROWS && (
        <Button variant="outline" size="sm" className="mb-6" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${matches.length} areas`}
        </Button>
      )}
    </section>
  );
}
