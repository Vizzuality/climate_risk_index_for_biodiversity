import { beforeAll, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
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
import { FiltersModal } from "@/containers/main/filters/modal";
import { Search } from "@/containers/main/filters/search";
import {
  AREA_LIST_SEARCH_DEFAULTS,
  type AreaFilters,
  useAreaFilters,
  validateAreaListSearch,
} from "@/containers/main/store";
import { stringifySearch } from "@/lib/search-params";
import { rootSearch, useScenario } from "@/store";

const area = (id: string, name: string, low: number, high: number, governance_type = ""): Area => ({
  id,
  name,
  name_fr: name,
  source: "",
  governance_type,
  status: "",
  designation_type: "",
  iucn_category: "",
  manager: "",
  url: null,
  area_km2: null,
  assessed_species: null,
  regions: [],
  depth_tiers: [],
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
  area("1", "Alpha", 0.9, 0.2, "MCA"),
  area("2", "Bravo", 0.5, 0.5, "EBSA"),
  area("3", "Charlie", 0.1, 0.8, "AOI"),
];

vi.mock("@/hooks/use-areas", () => ({ useAreas: () => ({ data: AREAS, isPending: false }) }));
vi.mock("@/hooks/use-area-ids-with-species", () => ({
  useAreaIdsWithSpecies: () => ({ data: undefined, isPending: true }),
}));
vi.mock("@/hooks/use-species", () => ({ useSpecies: () => ({ data: undefined }) }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});

function ScenarioButtons() {
  const [, setScenario] = useScenario();
  return <button onClick={() => setScenario("high")}>high scenario</button>;
}

let renderedFilters: AreaFilters | undefined;

function FiltersProbe() {
  const [filters] = useAreaFilters();
  useEffect(() => {
    renderedFilters = filters;
  }, [filters]);
  return null;
}

function renderTable(path = "/areas") {
  const rootRoute = createRootRoute({
    ...rootSearch,
    component: () => (
      <>
        <ScenarioButtons />
        <FiltersProbe />
        <Search placeholder="Search area by name" />
        <FiltersModal />
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
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

const areaOrder = () => screen.getAllByRole("link").map((link) => link.textContent);

describe("DataTable", () => {
  it("re-sorts by the selected scenario's risk when the scenario changes", async () => {
    renderTable("/areas?protection=");
    fireEvent.click(await screen.findByRole("button", { name: "Overall climate risk" }));
    expect(areaOrder()).toEqual(["Alpha", "Bravo", "Charlie"]);

    fireEvent.click(screen.getByRole("button", { name: "high scenario" }));
    await waitFor(() => expect(areaOrder()).toEqual(["Charlie", "Bravo", "Alpha"]));
  });

  it("filters from the q search param and pre-fills the search box", async () => {
    renderTable("/areas?q=alp");
    const search = await screen.findByRole<HTMLInputElement>("searchbox");
    expect(search.value).toBe("alp");
    expect(areaOrder()).toEqual(["Alpha"]);
  });

  it("writes the search to q and drops it when cleared", async () => {
    const router = renderTable("/areas?scenario=high&protection=");
    const search = await screen.findByRole("searchbox");

    fireEvent.change(search, { target: { value: "char" } });
    await waitFor(() =>
      expect(router.state.location.href).toBe("/areas?scenario=high&protection=&q=char"),
    );
    expect(areaOrder()).toEqual(["Charlie"]);

    fireEvent.change(search, { target: { value: "" } });
    await waitFor(() =>
      expect(router.state.location.href).toBe("/areas?scenario=high&protection="),
    );
    expect(areaOrder()).toHaveLength(3);
  });

  it("keeps q out of area detail links", async () => {
    renderTable("/areas?scenario=high&q=alp");
    const link = await screen.findByRole("link", { name: "Alpha" });
    expect(link.getAttribute("href")).toBe("/areas/1?scenario=high");
  });

  it("filters from the protection search param on load", async () => {
    renderTable("/areas?protection=ebsa,aoi");
    await screen.findByRole("link", { name: "Bravo" });
    expect(areaOrder()).toEqual(["Bravo", "Charlie"]);
  });

  it("writes the applied protection types to the URL", async () => {
    const router = renderTable("/areas?q=a&protection=");
    fireEvent.click(await screen.findByRole("button", { name: "Filters" }));
    fireEvent.click(await screen.findByRole("button", { name: "Governance type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Area of Interest" }));
    fireEvent.click(screen.getByRole("option", { name: "Marine Conserved Area" }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    fireEvent.click(await screen.findByRole("button", { name: "Apply Filters" }));

    await waitFor(() => expect(router.state.location.href).toBe("/areas?q=a&protection=aoi,mca"));
    expect(areaOrder()).toEqual(["Alpha", "Charlie"]);
  });

  it("keeps the parsed filters stable when the scenario changes", async () => {
    const router = renderTable("/areas?protection=ebsa");
    await screen.findByRole("link", { name: "Bravo" });
    const before = renderedFilters;

    fireEvent.click(screen.getByRole("button", { name: "high scenario" }));
    await waitFor(() =>
      expect(router.state.location.href).toBe("/areas?protection=ebsa&scenario=high"),
    );
    expect(renderedFilters).toBe(before);
  });

  it("starts on MCA and keeps an empty param once the filters are cleared", async () => {
    const router = renderTable("/areas");
    await screen.findByRole("link", { name: "Alpha" });
    expect(areaOrder()).toEqual(["Alpha"]);

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(await screen.findByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Filters" }));

    await waitFor(() => expect(router.state.location.href).toBe("/areas?protection="));
    expect(areaOrder()).toHaveLength(3);
  });
});
