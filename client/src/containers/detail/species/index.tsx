import { useDeferredValue, useState } from "react";
import { SearchIcon } from "lucide-react";

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
import { useAreaSpecies } from "@/hooks/use-area-species";
import { useSelectedArea } from "@/hooks/use-selected-area";
import { filterSpecies } from "@/lib/area-species";
import { riskClassFor } from "@/lib/risk-colormap";
import { useScenario } from "@/store";

// Areas hold hundreds to thousands of species; the rest are behind "Show all".
const COLLAPSED_ROWS = 10;

const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function RiskBadge({ value }: { value: number }) {
  const { color, label } = riskClassFor(value);
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium text-slate-900"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export default function AreaSpecies() {
  const area = useSelectedArea();
  const [scenario] = useScenario();
  const { data, isPending, isError } = useAreaSpecies(area?.id);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  // Filtering thousands of rows can lag a keystroke; let the input update first
  const deferredQuery = useDeferredValue(query);
  const species = data?.[scenario] ?? [];
  const matches = filterSpecies(species, deferredQuery);
  const rows = expanded ? matches : matches.slice(0, COLLAPSED_ROWS);

  return (
    <section className="space-y-4">
      <h3 className="text-slate-700 font-semibold text-[20px]">Species within the area</h3>
      <p className="text-slate-700">
        The species assessed in the area, ranked by their climate risk weighted by how much of the
        area they occupy.
      </p>
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <p className="text-sm text-slate-400">The species couldn’t be loaded.</p>
      ) : species.length === 0 ? (
        <p className="text-sm text-slate-400">No species data for this scenario.</p>
      ) : (
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500"
          />
          <Input
            type="search"
            aria-label="Search species by name"
            placeholder="Search species by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-[4px] border-slate-300 pl-10 shadow-none placeholder:text-slate-500"
          />
        </div>
      )}
      {species.length > 0 &&
        (matches.length === 0 ? (
          <p className="text-sm text-slate-400">No species match “{deferredQuery.trim()}”.</p>
        ) : (
          <Table>
            <TableBody>
              {rows.map(({ species_id, common_name, scientific_name, score }) => (
                <TableRow key={species_id}>
                  <TableCell className="whitespace-normal text-slate-700">
                    {common_name && <span className="block capitalize">{common_name}</span>}
                    <span className="block italic text-slate-500">{scientific_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-2 tabular-nums text-slate-700">
                      {scoreFormatter.format(score)}
                      <RiskBadge value={score} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <span className="sr-only">Species</span>
                </TableHead>
                <TableHead className="text-xs uppercase text-slate-700 text-right">
                  CRIB risk index
                </TableHead>
              </TableRow>
            </TableFooter>
          </Table>
        ))}
      {matches.length > COLLAPSED_ROWS && (
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${matches.length} species`}
        </Button>
      )}
    </section>
  );
}
