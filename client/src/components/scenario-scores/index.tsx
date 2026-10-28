import { RiskBadge } from "@/components/risk-badge";
import type { ScenarioScores as Scores } from "@/lib/scenario-scores";
import type { SCENARIO } from "@/types";

const SCENARIOS: { scenario: SCENARIO; tag: string; label: string }[] = [
  { scenario: "low", tag: "L", label: "Low emissions scenario" },
  { scenario: "high", tag: "H", label: "High emissions scenario" },
];

const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ScenarioScores({ scores }: Readonly<{ scores: Scores }>) {
  return (
    <span className="flex items-center justify-end gap-4 text-sm leading-4 tabular-nums text-slate-700">
      {SCENARIOS.map(({ scenario, tag, label }) => {
        const score = scores[scenario];
        return (
          <span key={scenario} className="flex items-center gap-1">
            <span
              title={label}
              className="flex size-4 items-center justify-center rounded-[4px] bg-slate-500 text-[10px] font-semibold text-white"
            >
              <span aria-hidden>{tag}</span>
              <span className="sr-only">{label}</span>
            </span>
            {score === null ? (
              "N/A"
            ) : (
              <>
                {scoreFormatter.format(score)}
                <RiskBadge value={score} />
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}
