import { RISK_CLASSES } from "@/lib/risk-colormap";

const segments = RISK_CLASSES.map((cls, i) => ({
  ...cls,
  width: ((RISK_CLASSES[i + 1]?.min ?? 1) - cls.min) * 100,
}));

export function DataTableLegend() {
  return (
    <div className="absolute bottom-0 left-0 px-8 py-4 right-0 grid grid-cols-2 justify-between items-center backdrop-blur-xs">
      <span className="uppercase text-xs font-semibold tracking-widest text-slate-700">
        climate risk index
      </span>
      <div className="flex grow px-4">
        {segments.map(({ color, label, width }) => (
          <div key={label} className="flex flex-col gap-2" style={{ width: `${width}%` }}>
            <div className="h-[9px] w-full" style={{ backgroundColor: color }} />
            <span className="text-center text-[10px] whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
