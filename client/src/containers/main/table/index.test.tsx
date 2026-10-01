import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  stripSearchParams,
} from "@tanstack/react-router";

import type { Area } from "@/containers/main/table/columns";
import DataTable from "@/containers/main/table";
import { Search } from "@/containers/main/filters/search";
import { AREA_LIST_SEARCH_DEFAULTS, validateAreaListSearch } from "@/containers/main/store";
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

function renderTable(path = "/areas") {
  const rootRoute = createRootRoute({
    ...scenarioSearch,
    component: () => (
      <>
        <ScenarioButtons />
        <Search />
        <DataTable />
      </>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/areas",
    validateSearch: validateAreaListSearch,
    search: { middlewares: [stripSearchParams(AREA_LIST_SEARCH_DEFAULTS)] },
  });
  const areaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, areaRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
  return router;
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

  it("filters from the q search param and pre-fills the search box", async () => {
    renderTable("/areas?q=bra");
    const search = await screen.findByRole<HTMLInputElement>("searchbox");
    expect(search.value).toBe("bra");
    expect(areaOrder()).toEqual(["Bravo"]);
  });

  it("writes the search to q and drops it when cleared", async () => {
    const router = renderTable("/areas?scenario=high");
    const search = await screen.findByRole("searchbox");

    fireEvent.change(search, { target: { value: "char" } });
    await waitFor(() => expect(router.state.location.href).toBe("/areas?scenario=high&q=char"));
    expect(areaOrder()).toEqual(["Charlie"]);

    fireEvent.change(search, { target: { value: "" } });
    await waitFor(() => expect(router.state.location.href).toBe("/areas?scenario=high"));
    expect(areaOrder()).toHaveLength(3);
  });

  it("keeps q out of area detail links", async () => {
    renderTable("/areas?scenario=high&q=bra");
    const link = await screen.findByRole("link", { name: "Bravo" });
    expect(link.getAttribute("href")).toBe("/areas/2?scenario=high");
  });
});
