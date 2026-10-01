import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import type { Area } from "@/containers/main/table/columns";
import DataTable from "@/containers/main/table";
import { scenarioSearch, useScenario } from "@/store";

const area = (id: string, name: string, low: number, high: number): Area => ({
  id,
  name,
  name_fr: name,
  source: "",
  layer_type: "",
  status: "",
  designation_type: "",
  iucn_category: "",
  manager: "",
  url: null,
  area_km2: null,
  assessed_species: null,
  bbox: null,
  indicator: [
    {
      name: "ClimVuln",
      type: "numerical",
      scenario: {
        low: { min: low, max: low, mean: low },
        high: { min: high, max: high, mean: high },
      },
    },
  ],
});

const AREAS = [
  area("1", "Alpha", 0.9, 0.2),
  area("2", "Bravo", 0.5, 0.5),
  area("3", "Charlie", 0.1, 0.8),
];

vi.mock("@/hooks/use-areas", () => ({ useAreas: () => ({ data: AREAS, isPending: false }) }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function ScenarioButtons() {
  const [, setScenario] = useScenario();
  return <button onClick={() => setScenario("high")}>high scenario</button>;
}

function renderTable() {
  const rootRoute = createRootRoute({
    ...scenarioSearch,
    component: () => (
      <>
        <ScenarioButtons />
        <DataTable />
      </>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas" });
  const areaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, areaRoute]),
    history: createMemoryHistory({ initialEntries: ["/areas"] }),
  });
  render(<RouterProvider router={router} />);
}

const areaOrder = () => screen.getAllByRole("link").map((link) => link.textContent);

describe("DataTable", () => {
  it("re-sorts by the selected scenario's risk when the scenario changes", async () => {
    renderTable();
    fireEvent.click(await screen.findByRole("button", { name: "Overall climate risk" }));
    expect(areaOrder()).toEqual(["Alpha", "Bravo", "Charlie"]);

    fireEvent.click(screen.getByRole("button", { name: "high scenario" }));
    await waitFor(() => expect(areaOrder()).toEqual(["Charlie", "Bravo", "Alpha"]));
  });
});
