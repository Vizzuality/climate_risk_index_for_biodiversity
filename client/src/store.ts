import { useQueryState } from "nuqs";
import { SCENARIO } from "@/types";

export const useScenario = () =>
  useQueryState<SCENARIO>("scenario", {
    defaultValue: "low",
    parse: (value) => value as SCENARIO,
    serialize: (value) => value,
  });
