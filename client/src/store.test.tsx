import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { scenarioSearch, useScenario } from "@/store";

function Toggle() {
  const [scenario, setScenario] = useScenario();
  return (
    <>
      <output>{scenario}</output>
      <button onClick={() => setScenario("low")}>low</button>
      <button onClick={() => setScenario("high")}>high</button>
    </>
  );
}

function renderAt(path: string) {
  const rootRoute = createRootRoute({
    ...scenarioSearch,
    component: () => (
      <>
        <Toggle />
        <Outlet />
      </>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const areaRoute = createRoute({ getParentRoute: () => rootRoute, path: "/$area" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, areaRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("useScenario", () => {
  it("writes a single query string on a dynamic route after repeated updates", async () => {
    const router = renderAt("/1192");
    const high = await screen.findByRole("button", { name: "high" });
    fireEvent.click(high);
    await waitFor(() => expect(router.state.location.href).toBe("/1192?scenario=high"));
    fireEvent.click(high);
    await new Promise((r) => setTimeout(r, 100));
    expect(router.state.location.href).toBe("/1192?scenario=high");
    expect(router.state.location.search).toEqual({ scenario: "high" });
    expect(screen.getByRole("status")).toHaveTextContent("high");
  });

  it("strips the default scenario from the URL", async () => {
    const router = renderAt("/1192?scenario=high");
    fireEvent.click(await screen.findByRole("button", { name: "low" }));
    await waitFor(() => expect(router.state.location.href).toBe("/1192"));
    expect(screen.getByRole("status")).toHaveTextContent("low");
  });

  it("falls back to the default for an unknown value", async () => {
    renderAt("/?scenario=bogus");
    expect(await screen.findByRole("status")).toHaveTextContent("low");
  });
});
