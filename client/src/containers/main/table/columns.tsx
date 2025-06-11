import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import RiskIndexChart from "@/containers/main/table/risk-index-chart";

export type Area = {
  id: string;
  name: string;
  index: number;
  species: number;
};

export const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "name",
    header: "Conservation Areas",
    cell: (ctx) => (
      <Link
        href={`/${ctx.row.id}`}
        className="max-w-full inline-block truncate hover:underline"
      >
        <span className="">{ctx.row.getValue("name")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "index",
    header: "Overall climate risk",
    cell: () => {
      const min = Math.floor(Math.random() * 101);
      const max = Math.floor(Math.random() * 101);
      const avg = Math.floor(Math.random() * (max - min + 1)) + min;
      return (
        <div className="border-l border-r border-slate-200 py-3 px-2">
          <RiskIndexChart
            range={{
              min: 0,
              max: 100,
            }}
            values={{
              min,
              max,
              avg,
            }}
          />
        </div>
      );
    },
  },
];
