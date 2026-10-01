import { type ColumnDef, sortFn_basic } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import type { AreaTableFeatures } from "@/containers/main/table/features";
import { RiskIndexChart } from "@/containers/main/table/risk-index-chart";
import { SortButton } from "@/containers/main/table/sort-button";
import type { SCENARIO } from "@/types";

export type IndicatorStats = {
  min: number | null;
  max: number | null;
  mean: number | null;
};

export type Area = {
  id: string;
  name: string;
  name_fr: string;
  source: string;
  layer_type: string;
  status: string;
  designation_type: string;
  iucn_category: string;
  manager: string;
  url: string | null;
  area_km2: number | null;
  assessed_species: number | null;
  bbox: [number, number, number, number] | null;
  indicator: {
    name: string;
    scenario: {
      high: IndicatorStats;
      low: IndicatorStats;
    };
    type: "numerical" | "categorical";
  }[];
};

const NameCell = ({ id, name }: { id: string; name: string }) => (
  <Link
    to="/$area"
    params={{ area: id }}
    title={name}
    className="block truncate pl-1 text-xs leading-4 tracking-[0.24px] text-slate-700 before:content-[counter(area)'._'] hover:underline"
  >
    {name}
  </Link>
);

const IndicatorCell = ({ indicators }: { indicators: Area["indicator"] }) => {
  const climVuln = indicators.find((indicator) => indicator.name === "ClimVuln");

  if (!climVuln) return null;

  const hasData = Object.values(climVuln.scenario).some(({ mean }) => mean !== null);

  return (
    <div className="relative before:absolute before:top-1/2 before:-left-1 before:h-7 before:-translate-y-1/2 before:border-l before:border-slate-300 after:absolute after:top-1/2 after:-right-1 after:h-7 after:-translate-y-1/2 after:border-r after:border-slate-300">
      {hasData ? (
        <RiskIndexChart range={{ min: 0, max: 1 }} values={climVuln.scenario} />
      ) : (
        <p className="flex h-6 items-center justify-center text-xs text-slate-400">No data</p>
      )}
    </div>
  );
};

const speciesFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const SpeciesCell = ({ count }: { count: number | null }) =>
  count === null ? (
    <p className="text-center text-xs text-slate-400">No data</p>
  ) : (
    <p className="text-center text-xs leading-4 tracking-[0.24px] text-slate-700">
      {speciesFormatter.format(count)}
    </p>
  );

const climVulnMean = (area: Area, scenario: SCENARIO) =>
  area.indicator.find((indicator) => indicator.name === "ClimVuln")?.scenario[scenario].mean ??
  undefined;

export type TableArea = Area & { risk: number | undefined };

// The table caches row values by column id and only re-sorts when its data
// changes, so the selected scenario's risk has to live in the data rather than
// in a scenario-dependent accessor.
export const toTableAreas = (areas: Area[], scenario: SCENARIO): TableArea[] =>
  areas.map((area) => ({ ...area, risk: climVulnMean(area, scenario) }));

export const areaColumns: ColumnDef<AreaTableFeatures, TableArea>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortButton column={column} enableSortingRemoval={false} className="pl-2">
        Conservation areas
      </SortButton>
    ),
    sortFn: (a, b) => a.original.name.localeCompare(b.original.name),
    cell: (ctx) => <NameCell id={ctx.row.original.id} name={ctx.row.original.name} />,
  },
  {
    accessorKey: "risk",
    header: ({ column }) => <SortButton column={column}>Overall climate risk</SortButton>,
    sortFn: sortFn_basic,
    sortDescFirst: true,
    sortUndefined: "last",
    cell: (ctx) => <IndicatorCell indicators={ctx.row.original.indicator} />,
    meta: { className: "w-47" },
  },
  {
    id: "assessed_species",
    accessorFn: (area) => area.assessed_species ?? undefined,
    header: ({ column }) => (
      <SortButton column={column} className="justify-center gap-2.5 text-center">
        <span className="w-min leading-3 whitespace-normal">Assessed Species</span>
      </SortButton>
    ),
    sortFn: sortFn_basic,
    sortDescFirst: true,
    sortUndefined: "last",
    cell: (ctx) => <SpeciesCell count={ctx.row.original.assessed_species} />,
    meta: { className: "w-28" },
  },
];
