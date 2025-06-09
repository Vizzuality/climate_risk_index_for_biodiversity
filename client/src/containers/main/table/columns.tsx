import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

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
        className="max-w-[175px] inline-block truncate hover:underline"
      >
        <span className="">{ctx.row.getValue("name")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "index",
    header: "Overall climate risk",
    cell: (ctx) => (
      <span className="text-center">{ctx.row.getValue("index")}</span>
    ),
  },
  {
    accessorKey: "species",
    header: "Assessed Species",
    cell: (ctx) => (
      <span className="text-center">{ctx.row.getValue("species")}</span>
    ),
  },
];
