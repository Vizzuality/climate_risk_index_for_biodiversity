import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RISK_CLASSES } from "@/lib/risk-colormap";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const classes = RISK_CLASSES.map((cls, i) => {
  const max = RISK_CLASSES[i + 1]?.min ?? 1;
  return {
    ...cls,
    width: (max - cls.min) * 100,
    range: `${formatter.format(cls.min)} – ${formatter.format(max)}`,
  };
});

export function DataTableLegend() {
  return (
    <div className="absolute right-0 bottom-0 left-0 flex h-9 items-center bg-linear-to-b from-slate-50/0 to-slate-50 to-70% px-8 backdrop-blur-xs">
      <div className="flex flex-1 items-center gap-1">
        <span className="text-xs leading-4 font-semibold tracking-[1.2px] text-slate-700 uppercase">
          climate risk index
        </span>
        <Popover>
          <PopoverTrigger
            aria-label="Climate risk index classes"
            className="cursor-pointer rounded-sm p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Info className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-auto" side="top" align="start" sideOffset={8}>
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
      </div>
      <div className="me-28 flex w-47 px-1" aria-hidden>
        {classes.map(({ color, label, width }) => (
          <div key={label} className="h-1" style={{ width: `${width}%`, backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
