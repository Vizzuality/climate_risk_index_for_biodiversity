import { type ColumnDef, sortFn_basic } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import type { DataTableFeatures } from "@/containers/main/table/features";
import { RiskClassesInfo } from "@/containers/main/table/risk-classes-info";
import { RiskIndexChart } from "@/containers/main/table/risk-index-chart";
import { SortButton } from "@/containers/main/table/sort-button";
import { type Species, speciesName } from "@/lib/species";
import type { SCENARIO } from "@/types";

const NameCell = ({ species }: { species: Species }) => (
  <Link
    to="/species/$speciesId"
    params={{ speciesId: String(species.id) }}
    title={speciesName(species)}
    className="flex min-w-0 gap-1 pl-1 text-xs leading-4 tracking-[0.24px] text-slate-700 before:content-[counter(species)'.'] hover:underline"
  >
    <span className="min-w-0">
      {species.common_name && (
        <span className="block truncate first-letter:uppercase">{species.common_name}</span>
      )}
      <span className="block truncate italic text-slate-500">{species.scientific_name}</span>
    </span>
  </Link>
);

const RiskCell = ({ risk }: { risk: Species["climate_risk"] }) => {
  const hasData = Object.values(risk).some(({ mean }) => mean !== null);

  return (
    <div className="relative before:absolute before:top-1/2 before:-left-1 before:h-7 before:-translate-y-1/2 before:border-l before:border-slate-300">
      {hasData ? (
        <RiskIndexChart range={{ min: 0, max: 1 }} values={risk} />
      ) : (
        <p className="flex h-6 items-center justify-center text-xs text-slate-500">No data</p>
      )}
    </div>
  );
};

export type TableSpecies = Species & { risk: number | undefined };

// Like the areas table, the selected scenario's risk lives in the data so a
// scenario change re-sorts the rows.
export const toTableSpecies = (species: Species[], scenario: SCENARIO): TableSpecies[] =>
  species.map((s) => ({ ...s, risk: s.climate_risk[scenario].mean ?? undefined }));

export const speciesColumns: ColumnDef<DataTableFeatures, TableSpecies>[] = [
  {
    id: "name",
    accessorFn: speciesName,
    header: ({ column }) => (
      <SortButton column={column} enableSortingRemoval={false} className="pl-2">
        Species
      </SortButton>
    ),
    sortFn: (a, b) => speciesName(a.original).localeCompare(speciesName(b.original)),
    cell: (ctx) => <NameCell species={ctx.row.original} />,
  },
  {
    accessorKey: "risk",
    header: ({ column }) => (
      <SortButton column={column} addon={<RiskClassesInfo />}>
        Overall climate risk
      </SortButton>
    ),
    sortFn: sortFn_basic,
    sortDescFirst: true,
    sortUndefined: "last",
    cell: (ctx) => <RiskCell risk={ctx.row.original.climate_risk} />,
    meta: { className: "w-47" },
  },
];
