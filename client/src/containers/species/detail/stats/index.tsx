import { ScenarioScores } from "@/components/scenario-scores";
import type { SpeciesDetail } from "@/lib/species";
import { useScenario } from "@/store";

const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function SpeciesStats({ species }: Readonly<{ species: SpeciesDetail }>) {
  const [scenario] = useScenario();
  const climVuln = species.indicator.find(({ name }) => name === "ClimVuln")?.scenario;
  const { min = null, max = null } = climVuln?.[scenario] ?? {};
  const scores = { low: climVuln?.low.mean ?? null, high: climVuln?.high.mean ?? null };

  return (
    <ul className="space-y-2">
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">Overall climate risk</span>
        <span className="flex flex-1">
          <ScenarioScores scores={scores} />
        </span>
      </li>
      <li className="flex items-center gap-1 py-2 border-b border-dashed border-b-slate-300 text-slate-600">
        <span className="flex-1 uppercase font-semibold text-xs">Range of risk</span>
        <span className="flex-1 tabular-nums">
          {min === null || max === null
            ? "N/A"
            : `${scoreFormatter.format(min)} – ${scoreFormatter.format(max)}`}
        </span>
      </li>
    </ul>
  );
}
