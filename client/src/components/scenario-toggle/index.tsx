import { useId } from "react";
import { cn } from "@/lib/utils";
import { useScenario } from "@/store";
import type { SCENARIO } from "@/types";

const OPTIONS: { scenario: SCENARIO; label: string }[] = [
  { scenario: "low", label: "Low" },
  { scenario: "high", label: "High" },
];

export default function ScenarioToggle() {
  const [scenario, setScenario] = useScenario();
  const labelId = useId();
  return (
    <div className="inline-flex items-center gap-2 rounded-[4px] bg-slate-50 pl-4">
      <span
        id={labelId}
        className="text-xs leading-4 font-semibold tracking-[1.2px] text-slate-700 uppercase"
      >
        Emissions scenario
      </span>
      <fieldset aria-labelledby={labelId} className="flex h-10 items-center gap-1 p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.scenario}
            type="button"
            aria-pressed={scenario === option.scenario}
            onClick={() => setScenario(option.scenario)}
            className={cn(
              "h-8 cursor-pointer rounded-[4px] px-3 text-sm leading-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              scenario === option.scenario
                ? "bg-teal-200 text-teal-950"
                : "border border-slate-300 text-slate-700 hover:bg-slate-200",
            )}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
