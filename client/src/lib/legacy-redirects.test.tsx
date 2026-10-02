import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { rootSearch } from "@/store";
import { redirectLegacyArea, redirectToAreas } from "@/lib/legacy-redirects";

function renderAt(path: string) {
  const rootRoute = createRootRoute({
    ...rootSearch,
    component: Outlet,
    notFoundComponent: () => <p>not found</p>,
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/", beforeLoad: redirectToAreas }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/$areaId",
      beforeLoad: redirectLegacyArea,
    }),
    createRoute({ getParentRoute: () => rootRoute, path: "/areas" }),
    createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" }),
  ]);
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history });
  render(<RouterProvider router={router} />);
  return { router, history };
}

describe("legacy redirects", () => {
  it.each([
    ["/", "/areas"],
    ["/?scenario=high", "/areas?scenario=high"],
    ["/1192", "/areas/1192"],
    ["/1192?scenario=high", "/areas/1192?scenario=high"],
  ])("redirects %s to %s without adding a history entry", async (from, to) => {
    const { router, history } = renderAt(from);
    await waitFor(() => expect(router.state.location.href).toBe(to));
    expect(history).toHaveLength(1);
  });

  it("renders not found for a top-level path that is not an area id", async () => {
    const { router } = renderAt("/species-typo");
    await screen.findByText("not found");
    expect(router.state.location.href).toBe("/species-typo");
  });
});
