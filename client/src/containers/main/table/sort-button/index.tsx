import type { Column } from "@tanstack/react-table";
import { ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SortButton<TData>({
  column,
  className,
  children,
}: Readonly<{ column: Column<TData>; className?: string; children: ReactNode }>) {
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 text-xs font-medium tracking-[0.24px] text-slate-500 hover:bg-slate-100 hover:text-slate-700",
        column.getIsSorted() && "text-slate-700",
        className,
      )}
    >
      {children}
      <ChevronsUpDown className="size-3 shrink-0" />
    </button>
  );
}
