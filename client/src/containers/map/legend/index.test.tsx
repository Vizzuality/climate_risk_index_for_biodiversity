import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { MapLegend } from "@/containers/map/legend";
import { stringifySearch } from "@/lib/search-params";
import { rootSearch } from "@/store";

function renderAt(path: string) {
  const rootRoute = createRootRoute({ ...rootSearch, component: MapLegend });
  const areasRoute = createRoute({ getParentRoute: () => rootRoute, path: "/areas" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([areasRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

const hrefBecomes = (router: ReturnType<typeof renderAt>, href: string) =>
  waitFor(() => expect(router.state.location.href).toBe(href));

describe("MapLegend", () => {
  it("lists the layers on the map, with no remove action for the climate raster", async () => {
    renderAt("/areas?layers=bioregions");
    const headings = await screen.findAllByRole("heading");
    expect(headings.map((h) => h.textContent)).toEqual(["Marine bioregions", "Climate Risk Index"]);
    expect(screen.getByRole("button", { name: "Remove Marine bioregions" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove Climate Risk Index" })).toBeNull();
  });

  it("hides and shows a layer through the URL", async () => {
    const router = renderAt("/areas");
    fireEvent.click(await screen.findByRole("button", { name: "Hide Climate Risk Index" }));
    await hrefBecomes(router, "/areas?hidden=risk");
    const show = await screen.findByRole("button", { name: "Show Climate Risk Index" });
    expect(show.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(show);
    await hrefBecomes(router, "/areas");
  });

  it("removes a contextual layer together with its settings", async () => {
    const router = renderAt("/areas?hidden=areas&opacity=areas:40,risk:60");
    fireEvent.click(await screen.findByRole("button", { name: "Remove Conservation areas" }));
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ layers: "", opacity: "risk:60" }),
    );
    expect(screen.queryByRole("heading", { name: "Conservation areas" })).toBeNull();
  });
});
