import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { IndicatorStats } from "@/containers/main/table/columns";
import { RISK_CLASSES, riskColorFor } from "@/lib/risk-colormap";
import type { SCENARIO } from "@/types";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SCENARIOS: { scenario: SCENARIO; label: string }[] = [
  { scenario: "low", label: "Low emissions" },
  { scenario: "high", label: "High emissions" },
];

type Range = { min: number; max: number };

function ScenarioTrack({
  label,
  range,
  stats,
}: Readonly<{ label: string; range: Range; stats: IndicatorStats }>) {
  const { min, mean, max } = stats;
  const toPercent = (value: number) => ((value - range.min) / (range.max - range.min)) * 100;

  return (
    <div className="relative h-px w-full bg-slate-300">
      {min !== null && mean !== null && max !== null && (
        <>
          <div
            className="absolute inset-y-0 rounded-xs bg-slate-700"
            style={{ left: `${toPercent(min)}%`, width: `${toPercent(max) - toPercent(min)}%` }}
          />
          <Popover>
            <PopoverTrigger
              aria-label={`${label}: mean ${formatter.format(mean)}`}
              className="absolute top-1/2 size-2 -translate-1/2 rotate-45 cursor-pointer shadow-md"
              style={{ left: `${toPercent(mean)}%`, backgroundColor: riskColorFor(mean) }}
            />
            <PopoverContent className="w-auto" side="top" sideOffset={8}>
              <p className="mb-1 text-xs font-semibold">{label}</p>
              <ul className="flex flex-col gap-1 text-xs">
                <li>
                  Min: <span className="font-semibold">{formatter.format(min)}</span>
                </li>
                <li>
                  Mean: <span className="font-semibold">{formatter.format(mean)}</span>
                </li>
                <li>
                  Max: <span className="font-semibold">{formatter.format(max)}</span>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}

export function RiskIndexChart({
  range,
  values,
}: Readonly<{
  range: Range;
  values: Record<SCENARIO, IndicatorStats>;
}>) {
  const toPercent = (value: number) => ((value - range.min) / (range.max - range.min)) * 100;

  return (
    <div className="relative flex h-6 flex-col justify-center gap-3">
      {RISK_CLASSES.slice(1).map(({ min }) => (
        <div
          key={min}
          className="absolute top-1/2 h-7 -translate-1/2 border-l border-dotted border-slate-300"
          style={{ left: `${toPercent(min)}%` }}
        />
      ))}
      {SCENARIOS.map(({ scenario, label }) => (
        <ScenarioTrack key={scenario} label={label} range={range} stats={values[scenario]} />
      ))}
    </div>
  );
}
