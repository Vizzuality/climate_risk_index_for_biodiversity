import type { ColumnDef, RowData } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { RiskIndexChart } from "@/containers/main/table/risk-index-chart";
import { SortButton } from "@/containers/main/table/sort-button";
import type { SCENARIO } from "@/types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

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

const climVulnMean = (area: Area, scenario: SCENARIO) =>
  area.indicator.find((indicator) => indicator.name === "ClimVuln")?.scenario[scenario].mean ??
  undefined;

export const getColumns = (scenario: SCENARIO): ColumnDef<Area>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortButton column={column} className="pl-2">
        Conservation areas
      </SortButton>
    ),
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    cell: (ctx) => <NameCell id={ctx.row.original.id} name={ctx.row.original.name} />,
  },
  {
    id: "risk",
    accessorFn: (area) => climVulnMean(area, scenario),
    header: ({ column }) => <SortButton column={column}>Overall climate risk</SortButton>,
    sortDescFirst: true,
    sortUndefined: "last",
    cell: (ctx) => <IndicatorCell indicators={ctx.row.original.indicator} />,
    meta: { className: "w-60" },
  },
];
