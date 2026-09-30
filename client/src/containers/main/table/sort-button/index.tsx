import type { Column, RowData } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import type { AreaTableFeatures } from "@/containers/main/table/features";
import { cn } from "@/lib/utils";

const SORT_ICONS = { asc: ChevronUp, desc: ChevronDown } as const;

export function SortButton<TData extends RowData, TValue>({
  column,
  enableSortingRemoval = true,
  className,
  children,
}: Readonly<{
  column: Column<AreaTableFeatures, TData, TValue>;
  enableSortingRemoval?: boolean;
  className?: string;
  children: ReactNode;
}>) {
  const sorted = column.getIsSorted();
  const Icon = sorted ? SORT_ICONS[sorted] : ChevronsUpDown;
  const nextDesc = sorted ? sorted === "asc" : column.getFirstSortDir() === "desc";

  return (
    <button
      type="button"
      onClick={
        enableSortingRemoval
          ? column.getToggleSortingHandler()
          : () => column.toggleSorting(nextDesc)
      }
      className={cn(
        "flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 text-xs font-medium tracking-[0.24px] text-slate-500 hover:bg-slate-100 hover:text-slate-700",
        sorted && "text-slate-700",
        className,
      )}
    >
      {children}
      <Icon className="size-3 shrink-0" />
    </button>
  );
}
