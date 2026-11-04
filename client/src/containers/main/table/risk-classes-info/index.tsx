import { InfoPopover } from "@/components/info-popover";
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
    <InfoPopover label="Climate risk index classes" className="w-auto">
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
    </InfoPopover>
  );
}
