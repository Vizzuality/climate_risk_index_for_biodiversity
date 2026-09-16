import {
  type SearchSchemaInput,
  retainSearchParams,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { atom } from "jotai";
import { GeoJSONFeature, LngLat } from "mapbox-gl";
import { SCENARIO } from "@/types";

const DEFAULT_SCENARIO: SCENARIO = "low";

type ScenarioSearch = { scenario: SCENARIO };

export const scenarioSearch = {
  validateSearch: (search: { scenario?: unknown } & SearchSchemaInput): ScenarioSearch => ({
    scenario: search.scenario === "high" ? "high" : DEFAULT_SCENARIO,
  }),
  search: {
    middlewares: [
      retainSearchParams<ScenarioSearch>(true),
      stripSearchParams<ScenarioSearch>({ scenario: DEFAULT_SCENARIO }),
    ],
  },
};

export const useScenario = () => {
  const { scenario } = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const setScenario = (next: SCENARIO) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, scenario: next }), replace: true });
  return [scenario, setScenario] as const;
};

export const popupAtom = atom<(GeoJSONFeature & { lngLat: LngLat }) | null>(null);
