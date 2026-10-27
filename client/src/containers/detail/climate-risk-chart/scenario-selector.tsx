import { cn } from "@/lib/utils";
import { useScenario } from "@/store";
import type { SCENARIO } from "@/types";

const OPTIONS: { scenario: SCENARIO; label: string }[] = [
  { scenario: "low", label: "Low emissions" },
  { scenario: "high", label: "High emissions" },
];

export function ScenarioSelector() {
  const [scenario, setScenario] = useScenario();

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
      <span className="text-xs leading-4 font-semibold uppercase tracking-[1.2px] text-slate-700">
        Showing:
      </span>
      <fieldset
        aria-label="Emissions scenario"
        className="flex rounded-[4px] border border-slate-500"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.scenario}
            type="button"
            aria-pressed={scenario === option.scenario}
            onClick={() => setScenario(option.scenario)}
            className={cn(
              "min-w-[110px] cursor-pointer px-2 py-1 text-[10px] leading-4 font-semibold uppercase tracking-[1px] text-slate-700",
              scenario === option.scenario && "bg-slate-500 text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
