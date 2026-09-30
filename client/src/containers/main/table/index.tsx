import { type Row, type SortingState, flexRender, useTable } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type Area, getColumns } from "./columns";

import { type AreaTableFeatures, areaTableFeatures } from "@/containers/main/table/features";
import { DataTableLegend } from "@/containers/main/table/legend";
import { useAreas } from "@/hooks/use-areas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { memo, useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { searchAtom } from "@/containers/main/store";
import { cn } from "@/lib/utils";
import { filterByAreaName } from "@/utils/filters";
import { useScenario } from "@/store";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

type AreaRowProps = Readonly<{ row: Row<AreaTableFeatures, Area> }>;

// A row keeps its identity when the columns change (e.g. on a scenario
// switch); cells are cached per row and column, so compare those instead.
function isSameRow({ row: prev }: AreaRowProps, { row: next }: AreaRowProps) {
  const prevCells = prev.getAllCells();
  const nextCells = next.getAllCells();
  return (
    prevCells.length === nextCells.length && prevCells.every((cell, i) => cell === nextCells[i])
  );
}

const AreaRow = memo(function AreaRow({ row }: AreaRowProps) {
  return (
    <TableRow className="border-slate-200 [counter-increment:area]">
      {row.getAllCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn("px-1 py-1.5", cell.column.columnDef.meta?.className)}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}, isSameRow);

export default function DataTable() {
  const searchValue = useAtomValue(searchAtom);
  const { data, isPending } = useAreas();
  const [scenario] = useScenario();
  const columns = useMemo(() => getColumns(scenario), [scenario]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const filteredData = useMemo(() => {
    let x = data ?? [];
    if (searchValue !== "") x = filterByAreaName(x, searchValue);
    return x;
  }, [data, searchValue]);

  const table = useTable({
    features: areaTableFeatures,
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (area) => area.id,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!filteredData?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-500">No conservation areas found.</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <p className="flex h-8 items-center gap-1 pt-1 text-xs leading-4 tracking-[0.24px] text-slate-500">
        Total of
        <span className="rounded-xs border border-primary bg-teal-100 px-1 text-slate-600">
          {filteredData.length}
        </span>
        conservation areas
      </p>
      <ScrollArea className="flex-1 h-full overflow-hidden pb-12 **:data-[slot=table-container]:overflow-visible">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
                      className={cn(
                        "px-0.5 first:pl-0 shadow-[inset_0_-1px_0] shadow-slate-300",
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[counter-reset:area]">
            {table.getRowModel().rows.map((row) => (
              <AreaRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <DataTableLegend />
    </div>
  );
}
