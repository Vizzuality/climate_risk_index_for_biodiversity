"use client";

import { Button } from "@/components/ui/button";
import { useScenario } from "@/store";

export default function ScenarioToggle() {
  const [scenario, setScenario] = useScenario();
  return (
    <div className="absolute z-10 inline-flex top-4 right-4 items-center justify-center bg-background rounded-lg py-1 px-4 gap-2">
      <span className="uppercase font-semibold text-xs tracking-wide font-sans">
        Emissions scenario
      </span>
      <div className="flex gap-1 items-center">
        <Button
          onClick={async () => {
            await setScenario("low");
          }}
          className="text-accent-foreground font-normal border-0"
          variant={scenario === "low" ? "default" : "outline"}
        >
          Low
        </Button>
        <Button
          onClick={async () => {
            await setScenario("high");
          }}
          className="text-accent-foreground font-normal border-0"
          variant={scenario === "high" ? "default" : "outline"}
        >
          High
        </Button>
      </div>
    </div>
  );
}
