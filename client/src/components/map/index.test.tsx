import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEffect, useImperativeHandle, type Ref } from "react";
import { act, render, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import type { Area } from "@/containers/main/table/columns";
import { MapView } from "@/components/map";
import { validateAreaListSearch } from "@/containers/main/store";
import { validateSpeciesListSearch } from "@/containers/species/store";
import { stringifySearch } from "@/lib/search-params";
import { rootSearch } from "@/store";

const CODVILLE_BBOX: NonNullable<Area["bbox"]> = [-128.4, 52, -128.2, 52.1];

const map = vi.hoisted(() => ({
  fitBounds: vi.fn(),
  loaded: false,
  initialViewState: undefined as { bounds?: unknown } | undefined,
}));

vi.mock("react-map-gl/mapbox", () => ({
  default: function FakeMap({
    ref,
    initialViewState,
    onLoad,
  }: {
    ref: Ref<unknown>;
    initialViewState: { bounds?: unknown };
    onLoad: (evt: unknown) => void;
  }) {
    map.initialViewState ??= initialViewState;
    useImperativeHandle(ref, () => ({ fitBounds: map.fitBounds }));
    useEffect(() => {
      if (map.loaded) return;
      map.loaded = true;
      onLoad({
        target: {
          setTerrain: () => {},
          touchZoomRotate: { disableRotation: () => {} },
          keyboard: { disableRotation: () => {} },
        },
      });
    }, [onLoad]);
    return null;
  },
  Popup: () => null,
}));
vi.mock("@/components/map/scale-bar", () => ({ ScaleBar: () => null }));
vi.mock("@/hooks/use-areas", () => ({
  useAreas: () => ({
    data: [
      { id: "1", name: "Codville Lagoon Marine Park", governance_type: "MCA", bbox: CODVILLE_BBOX },
      {
        id: "2",
        name: "Bowie Seamount",
        governance_type: "MCA",
        bbox: [-135.5, 53.2, -134.5, 53.6],
      },
    ],
    isPending: false,
    failureCount: 0,
  }),
}));
vi.mock("@/hooks/use-area-ids-with-species", () => ({
  useAreaIdsWithSpecies: () => ({ data: undefined, isPending: false }),
}));

function renderMap(path: string) {
  const rootRoute = createRootRoute({ ...rootSearch, component: () => <MapView /> });
  const areasRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/areas",
    validateSearch: validateAreaListSearch,
  });
  const speciesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/species",
    validateSearch: validateSpeciesListSearch,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([areasRoute, speciesRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
    stringifySearch,
  });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  map.fitBounds.mockClear();
  map.loaded = false;
  map.initialViewState = undefined;
});

describe("MapView search framing", () => {
  it.each([
    ["/areas", true],
    ["/species", false],
  ])("on %s, fits areas named like the search: %s", async (path, fits) => {
    const router = renderMap(path);
    await waitFor(() => expect(map.loaded).toBe(true));
    await act(() => router.navigate({ to: path, search: { q: "cod" } }));

    if (fits) {
      expect(map.fitBounds).toHaveBeenCalledWith(CODVILLE_BBOX, expect.anything());
    } else {
      expect(map.fitBounds).not.toHaveBeenCalled();
    }
  });

  it("opens a searched species list on the full extent, not on matching areas", async () => {
    renderMap("/species?q=cod");
    await waitFor(() => expect(map.initialViewState).toBeDefined());

    expect(map.initialViewState?.bounds).not.toEqual(CODVILLE_BBOX);
  });
});
