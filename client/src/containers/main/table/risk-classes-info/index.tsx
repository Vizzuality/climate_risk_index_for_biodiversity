import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RISK_CLASSES } from "@/lib/risk-colormap";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const classes = RISK_CLASSES.map((cls, i) => ({
  ...cls,
  range: `${formatter.format(cls.min)} – ${formatter.format(RISK_CLASSES[i + 1]?.min ?? 1)}`,
}));

export function RiskClassesInfo() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Climate risk index classes"
        className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-auto" side="bottom" align="start" sideOffset={8}>
        <p className="mb-2 text-xs font-semibold">Climate risk index</p>
        <ul className="flex flex-col gap-1.5 text-xs">
          {classes.map(({ color, label, range }) => (
            <li key={label} className="flex items-center gap-2">
              <span className="h-1 w-4 shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1">{label}</span>
              <span className="pl-4 text-slate-500 tabular-nums">{range}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
