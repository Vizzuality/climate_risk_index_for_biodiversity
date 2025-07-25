"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Area, columns } from "./columns";

import DataTableLegend from "@/containers/main/table/legend";
import data from "@/data/wdpa.json";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";
import { useAtomValue } from "jotai";

import { searchAtom } from "@/containers/main/store";
import { filterByAreaName } from "@/utils/filters";
export default function DataTable() {
  const searchValue = useAtomValue(searchAtom);

  const filteredData = useMemo(() => {
    let x = data as Area[];
    if (searchValue !== "") x = filterByAreaName(x, searchValue);
    return x;
  }, [searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!filteredData?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-500">No conservation areas found.</span>
      </div>
    );
  }

  return (
    <>
      {filteredData.length && (
        <span>Total of {filteredData.length} conservation areas</span>
      )}
      <ScrollArea className="flex-1 h-full overflow-hidden pb-12">
        <Table className="h-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="w-1/2 max-w-1/2 font-medium"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      <DataTableLegend />
    </>
  );
}
