import { InfoPopover } from "@/components/info-popover";
import { ScenarioRanges, ScenarioScores } from "@/components/scenario-scores";
import type { SpeciesDetail } from "@/lib/species";

const NO_RANGE = { min: null, max: null };

export default function SpeciesStats({ species }: Readonly<{ species: SpeciesDetail }>) {
  const climVuln = species.indicator.find(({ name }) => name === "ClimVuln")?.scenario;
  const scores = { low: climVuln?.low.mean ?? null, high: climVuln?.high.mean ?? null };
  const ranges = { low: climVuln?.low ?? NO_RANGE, high: climVuln?.high ?? NO_RANGE };

  return (
    <ul className="space-y-2">
      <li className="flex min-h-8 items-center gap-1 py-1.5 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex flex-1 items-center gap-1 uppercase font-semibold text-xs">
          <span>Overall climate risk</span>
          <InfoPopover label="About Overall climate risk">
            Average climate risk across the species’ entire distribution range, under the low and
            high emissions scenarios.
          </InfoPopover>
        </span>
        <span className="flex flex-1">
          <ScenarioScores scores={scores} />
        </span>
      </li>
      <li className="flex min-h-8 items-center gap-1 py-1.5 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex flex-1 items-center gap-1 uppercase font-semibold text-xs">
          <span>Range of risk</span>
          <InfoPopover label="About Range of risk">
            Minimum and maximum climate risk found across the species’ distribution range, under the
            low and high emissions scenarios.
          </InfoPopover>
        </span>
        <span className="flex flex-1">
          <ScenarioRanges ranges={ranges} />
        </span>
      </li>
    </ul>
  );
}
