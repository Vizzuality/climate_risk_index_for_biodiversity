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
import {
  rootSearch,
  useContextualLayers,
  useLayerSettings,
  useMapBbox,
  useScenario,
} from "@/store";

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

function LayerSettingsProbe() {
  const { isVisible, opacity, setVisible, setOpacity } = useLayerSettings();
  return (
    <>
      <output aria-label="risk">{`${isVisible("risk")}:${opacity("risk")}`}</output>
      <output aria-label="areas">{`${isVisible("areas")}:${opacity("areas")}`}</output>
      <button onClick={() => setVisible("risk", false)}>hide risk</button>
      <button onClick={() => setVisible("risk", true)}>show risk</button>
      <button onClick={() => setVisible("areas", false)}>hide areas settings</button>
      <button onClick={() => setOpacity("risk", 60)}>dim risk</button>
      <button onClick={() => setOpacity("risk", 100)}>restore risk</button>
      <button onClick={() => setOpacity("areas", 40)}>dim areas</button>
    </>
  );
}

function BboxProbe() {
  const [bbox, setBbox] = useMapBbox();
  return (
    <>
      <output aria-label="bbox">{bbox?.join(",") ?? "none"}</output>
      <button onClick={() => setBbox([-130.123456789, 40.5, -60.2, 60.1000001])}>move</button>
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
        <LayerSettingsProbe />
        <BboxProbe />
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

describe("useLayerSettings", () => {
  it("writes visibility and opacity and strips them when back to the defaults", async () => {
    const router = renderAt("/areas");
    expect(await findStatus("risk")).toBe("true:100");
    fireEvent.click(screen.getByRole("button", { name: "hide risk" }));
    await hrefBecomes(router, "/areas?hidden=risk");
    fireEvent.click(screen.getByRole("button", { name: "dim risk" }));
    await hrefBecomes(router, "/areas?hidden=risk&opacity=risk:60");
    expect(await findStatus("risk")).toBe("false:60");
    fireEvent.click(screen.getByRole("button", { name: "show risk" }));
    fireEvent.click(screen.getByRole("button", { name: "restore risk" }));
    await hrefBecomes(router, "/areas");
    expect(await findStatus("risk")).toBe("true:100");
  });

  it("carries the settings across links", async () => {
    renderAt("/areas/1192?hidden=areas&opacity=risk:60");
    expect(await findLinkHref("areas")).toBe("/areas?hidden=areas&opacity=risk:60");
  });

  it("drops settings for contextual layers that aren't on the map", async () => {
    renderAt("/areas?layers=&hidden=areas,risk&opacity=areas:40,risk:60");
    expect(await findStatus("areas")).toBe("false:100");
    expect(await findStatus("risk")).toBe("false:60");
    expect(await findLinkHref("areas")).toBe("/areas?layers=&hidden=risk&opacity=risk:60");
  });

  it("clears a contextual layer's settings when it is switched off", async () => {
    const router = renderAt("/areas");
    fireEvent.click(await screen.findByRole("button", { name: "hide areas settings" }));
    fireEvent.click(screen.getByRole("button", { name: "dim areas" }));
    await hrefBecomes(router, "/areas?hidden=areas&opacity=areas:40");
    fireEvent.click(screen.getByRole("button", { name: "hide areas" }));
    await hrefBecomes(router, "/areas?layers=");
    fireEvent.click(screen.getByRole("button", { name: "show areas" }));
    await hrefBecomes(router, "/areas");
    expect(await findStatus("areas")).toBe("true:100");
  });
});

describe("useMapBbox", () => {
  it("writes the view rounded to five decimals and carries it across links", async () => {
    const router = renderAt("/areas/1192");
    fireEvent.click(await screen.findByRole("button", { name: "move" }));
    await hrefBecomes(router, "/areas/1192?bbox=-130.12346,40.5,-60.2,60.1");
    expect(await findStatus("bbox")).toBe("-130.12346,40.5,-60.2,60.1");
    expect(await findLinkHref("areas")).toBe("/areas?bbox=-130.12346,40.5,-60.2,60.1");
  });

  it("accepts longitudes west of the antimeridian", async () => {
    renderAt("/areas?bbox=-224.17,30.2,-16.36,75.23");
    expect(await findStatus("bbox")).toBe("-224.17,30.2,-16.36,75.23");
  });

  it.each([
    ["too few values", "-130,40,-60"],
    ["a non-numeric value", "-130,40,west,60"],
    ["an empty value", "-130,,-60,60"],
    ["an inverted box", "-60,40,-130,60"],
    ["a flat box", "-130,40,-60,40"],
  ])("drops %s from the URL", async (_, bbox) => {
    const router = renderAt(`/areas?bbox=${bbox}`);
    expect(await findStatus("bbox")).toBe("none");
    expect(await findLinkHref("areas")).toBe("/areas");
    expect(router.state.location.search).not.toHaveProperty("bbox");
  });
});
