import { RISK_CLASSES } from "@/lib/risk-colormap";
import { cn } from "@/lib/utils";

const classes = RISK_CLASSES.map((cls, i) => ({
  ...cls,
  width: ((RISK_CLASSES[i + 1]?.min ?? 1) - cls.min) * 100,
}));

// `className` lines the bar up with the risk column, past the columns after it.
export function DataTableLegend({ className = "me-28" }: Readonly<{ className?: string }>) {
  return (
    <div className="absolute right-0 bottom-0 left-0 flex h-9 items-center bg-linear-to-b from-slate-50/0 to-slate-50 to-70% px-8 backdrop-blur-xs">
      <span className="flex-1 text-xs leading-4 font-semibold tracking-[1.2px] text-slate-700 uppercase">
        climate risk index
      </span>
      <div className={cn("flex w-47 px-1", className)} aria-hidden>
        {classes.map(({ color, label, width }) => (
          <div key={label} className="h-1" style={{ width: `${width}%`, backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}
