import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { rootSearch } from "@/store";
import Navigation from "@/components/navigation";

function renderAt(path: string) {
  const rootRoute = createRootRoute({ ...rootSearch, component: Navigation });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/areas" }),
      createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" }),
      createRoute({ getParentRoute: () => rootRoute, path: "/species" }),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
}

describe("Navigation", () => {
  it.each(["/areas", "/areas?scenario=high", "/areas/1192", "/areas/1192?scenario=high"])(
    "marks the conservation areas section as current on %s",
    async (path) => {
      renderAt(path);
      const link = await screen.findByRole("link", { name: "Conservation Areas" });
      expect(link.getAttribute("aria-current")).toBe("page");
    },
  );

  it.each(["/species", "/species?scenario=high&q=whale"])(
    "marks only the species section as current on %s",
    async (path) => {
      renderAt(path);
      const link = await screen.findByRole("link", { name: "Species" });
      expect(link.getAttribute("aria-current")).toBe("page");
      const areas = screen.getByRole("link", { name: "Conservation Areas" });
      expect(areas.getAttribute("aria-current")).toBeNull();
    },
  );
});
