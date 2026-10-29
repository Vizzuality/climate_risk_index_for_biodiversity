import { describe, expect, it } from "vitest";
import type { Area } from "@/containers/main/table/columns";
import { areaPeerComparison } from "@/lib/area-peer-comparison";

function makeArea(
  id: string,
  governance_type: string,
  regions: string[],
  low: number | null,
  high: number | null,
): Area {
  return {
    id,
    name: `Area ${id}`,
    name_fr: "",
    source: "CPCAD",
    governance_type,
    status: "Designated",
    designation_type: "",
    iucn_category: "",
    manager: "",
    url: null,
    area_km2: null,
    assessed_species: null,
    regions,
    depth_tiers: [],
    bbox: null,
    indicator: [
      {
        name: "ClimVuln",
        type: "numerical",
        scenario: {
          low: { min: low, mean: low, max: low },
          high: { min: high, mean: high, max: high },
        },
      },
    ],
  };
}

const SCOTIAN = "Scotian Shelf and Bay of Fundy";
const GULF = "The Estuary and the Gulf of St. Lawrence";

describe("areaPeerComparison", () => {
  const area = makeArea("1", "MCA", [SCOTIAN, GULF], 0.9, 0.95);
  const areas = [
    area,
    makeArea("2", "MCA", [SCOTIAN], 0.2, 0.4),
    makeArea("3", "MCA", [GULF], 0.4, 0.6),
    makeArea("4", "EBSA", [SCOTIAN], 0.6, 0.8),
    makeArea("5", "MCA", [SCOTIAN], null, null),
  ];

  it("lists the area, then each of its bioregions, then its protection type", () => {
    const rows = areaPeerComparison(area, areas);

    expect(rows.map(({ label, description }) => [label, description])).toEqual([
      ["This area", undefined],
      [SCOTIAN, "Bioregion · 2 areas"],
      ["Estuary and the Gulf of St. Lawrence", "Bioregion · 1 area"],
      ["Marine Conserved Area", "Protection type · 2 areas"],
    ]);
    expect(rows[0].values?.high.mean).toBe(0.95);
  });

  it("averages the peers' means without the area itself or peers with no data", () => {
    const [, scotian, , governance] = areaPeerComparison(area, areas);

    expect(scotian.values?.low).toEqual({ min: 0.2, mean: expect.closeTo(0.4), max: 0.6 });
    expect(scotian.values?.high).toEqual({ min: 0.4, mean: expect.closeTo(0.6), max: 0.8 });
    expect(governance.values?.low).toEqual({ min: 0.2, mean: expect.closeTo(0.3), max: 0.4 });
  });

  it("has no values for an area without data or a group without peers", () => {
    const lone = makeArea("6", "AOI", [], null, null);
    const rows = areaPeerComparison(lone, [...areas, lone]);

    expect(rows).toHaveLength(2);
    expect(rows[0].values).toBeNull();
    expect(rows[1]).toMatchObject({
      label: "Area of Interest",
      description: "Protection type · 0 areas",
      values: null,
    });
  });
});
