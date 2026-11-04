import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function InfoPopover({
  label,
  className,
  children,
}: Readonly<{ label: string; className?: string; children: React.ReactNode }>) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className={cn("text-xs", className)} side="top" align="center" sideOffset={8}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
