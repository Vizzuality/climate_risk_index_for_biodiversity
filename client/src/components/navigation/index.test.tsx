import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { scenarioSearch } from "@/store";
import Navigation from "@/components/navigation";

function renderAt(path: string) {
  const rootRoute = createRootRoute({ ...scenarioSearch, component: Navigation });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/areas" }),
      createRoute({ getParentRoute: () => rootRoute, path: "/areas/$areaId" }),
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
});
