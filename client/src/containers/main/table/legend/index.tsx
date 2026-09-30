import { RISK_CLASSES } from "@/lib/risk-colormap";

const segments = RISK_CLASSES.map((cls, i) => ({
  ...cls,
  width: ((RISK_CLASSES[i + 1]?.min ?? 1) - cls.min) * 100,
}));

export function DataTableLegend() {
  return (
    <div className="absolute right-0 bottom-0 left-0 flex h-9 items-center bg-linear-to-b from-slate-50/0 to-slate-50 to-70% px-8 backdrop-blur-xs">
      <span className="flex-1 text-xs leading-4 font-semibold tracking-[1.2px] text-slate-700 uppercase">
        climate risk index
      </span>
      <div className="flex w-60 px-1">
        {segments.map(({ color, label, width }) => (
          <div key={label} className="flex flex-col gap-0.5" style={{ width: `${width}%` }}>
            <div className="h-1 w-full" style={{ backgroundColor: color }} />
            <span className="text-center text-[10px] leading-3.5 whitespace-nowrap text-slate-700">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
