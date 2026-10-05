import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { stringifySearch } from "@/lib/search-params";
import { rootSearch, useContextualLayers, useScenario } from "@/store";

function Toggle() {
  const [scenario, setScenario] = useScenario();
  return (
    <>
      <output aria-label="scenario">{scenario}</output>
      <button onClick={() => setScenario("low")}>low</button>
      <button onClick={() => setScenario("high")}>high</button>
    </>
  );
}

function LayerToggles() {
  const [visible, setLayerVisible] = useContextualLayers();
  return (
    <>
      <output aria-label="layers">{visible.join(",")}</output>
      <button onClick={() => setLayerVisible("areas", false)}>hide areas</button>
      <button onClick={() => setLayerVisible("areas", true)}>show areas</button>
      <button onClick={() => setLayerVisible("bioregions", false)}>hide bioregions</button>
    </>
  );
}

function renderAt(path: string) {
  const rootRoute = createRootRoute({
    ...rootSearch,
    component: () => (
      <>
        <Toggle />
        <LayerToggles />
        <Link to="/areas">areas</Link>
        <Outlet />
      </>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas" });
  const areaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, areaRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

type TestRouter = ReturnType<typeof renderAt>;

const hrefBecomes = (router: TestRouter, href: string) =>
  waitFor(() => expect(router.state.location.href).toBe(href));

const findStatus = async (name: string) =>
  (await screen.findByRole("status", { name })).textContent;

const findLinkHref = async (name: string) =>
  (await screen.findByRole("link", { name })).getAttribute("href");

describe("useScenario", () => {
  it("writes a single query string on a dynamic route after repeated updates", async () => {
    const router = renderAt("/areas/1192");
    const high = await screen.findByRole("button", { name: "high" });
    fireEvent.click(high);
    await hrefBecomes(router, "/areas/1192?scenario=high");
    fireEvent.click(high);
    await new Promise((r) => setTimeout(r, 100));
    expect(router.state.location.href).toBe("/areas/1192?scenario=high");
    expect(router.state.location.search).toEqual({ scenario: "high" });
    expect(await findStatus("scenario")).toBe("high");
  });

  it("strips the default scenario from the URL", async () => {
    const router = renderAt("/areas/1192?scenario=high");
    fireEvent.click(await screen.findByRole("button", { name: "low" }));
    await hrefBecomes(router, "/areas/1192");
    expect(await findStatus("scenario")).toBe("low");
  });

  it("keeps the default scenario out of link hrefs", async () => {
    renderAt("/areas/1192");
    expect(await findLinkHref("areas")).toBe("/areas");
  });

  it("falls back to the default for an unknown value", async () => {
    renderAt("/areas?scenario=bogus");
    expect(await findStatus("scenario")).toBe("low");
  });
});

describe("useContextualLayers", () => {
  it("shows only the areas layer by default and strips the param when back to it", async () => {
    const router = renderAt("/areas");
    expect(await findStatus("layers")).toBe("areas");
    fireEvent.click(screen.getByRole("button", { name: "hide areas" }));
    await hrefBecomes(router, "/areas?layers=");
    fireEvent.click(screen.getByRole("button", { name: "show areas" }));
    await hrefBecomes(router, "/areas");
    expect(await findStatus("layers")).toBe("areas");
  });

  it("keeps an empty param when every layer is hidden", async () => {
    const router = renderAt("/areas?layers=bioregions");
    fireEvent.click(await screen.findByRole("button", { name: "hide bioregions" }));
    await hrefBecomes(router, "/areas?layers=");
    expect(await findStatus("layers")).toBe("");
  });

  it("drops unknown layers and keeps the rest in a fixed order", async () => {
    renderAt("/areas?layers=bioregions,bogus,areas");
    expect(await findStatus("layers")).toBe("areas,bioregions");
  });

  it("carries the layers across links", async () => {
    renderAt("/areas/1192?layers=bioregions");
    expect(await findLinkHref("areas")).toBe("/areas?layers=bioregions");
  });
});
