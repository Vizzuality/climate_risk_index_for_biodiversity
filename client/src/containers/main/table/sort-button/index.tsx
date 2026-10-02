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
  addon,
  children,
}: Readonly<{
  column: Column<AreaTableFeatures, TData, TValue>;
  enableSortingRemoval?: boolean;
  className?: string;
  addon?: ReactNode;
  children: ReactNode;
}>) {
  const sorted = column.getIsSorted();
  const Icon = sorted ? SORT_ICONS[sorted] : ChevronsUpDown;
  const nextDesc = sorted ? sorted === "asc" : column.getFirstSortDir() === "desc";

  // The button's ::after stretches its click target over the whole header, so
  // an addon must stay a sibling (no nested buttons) and sit above it.
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center justify-between gap-2 rounded-sm px-3 text-xs font-medium tracking-[0.24px] text-slate-500 hover:bg-slate-100 hover:text-slate-700",
        sorted && "text-slate-700",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={
            enableSortingRemoval
              ? column.getToggleSortingHandler()
              : () => column.toggleSorting(nextDesc)
          }
          className="cursor-pointer after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-slate-400"
        >
          {children}
        </button>
        {addon && <div className="relative z-10 flex">{addon}</div>}
      </div>
      <Icon className="size-3 shrink-0" />
    </div>
  );
}
