import { describe, expect, it } from "vitest";

import type { Area } from "@/containers/main/table/columns";
import { AREA_CSV_COLUMNS, areasCsvFilename } from "@/containers/main/table/csv";
import { toCsv } from "@/lib/csv";

const NO_STATS = { min: null, mean: null, max: null };

const area: Area = {
  id: "42",
  name: "Bird Islands",
  name_fr: "Îles aux Oiseaux",
  source: "",
  layer_type: "",
  status: "",
  designation_type: "",
  iucn_category: "",
  manager: "",
  url: null,
  area_km2: null,
  assessed_species: 12,
  regions: [],
  bbox: null,
  indicator: [{ name: "ClimVuln", type: "numerical", scenario: { low: NO_STATS, high: NO_STATS } }],
};

describe("AREA_CSV_COLUMNS", () => {
  it("exports empty risk cells for an area without climate risk data", () => {
    expect(toCsv([area], AREA_CSV_COLUMNS).split("\r\n")).toEqual([
      "id,name,climate_risk_low_emissions_min,climate_risk_low_emissions_mean,climate_risk_low_emissions_max,climate_risk_high_emissions_min,climate_risk_high_emissions_mean,climate_risk_high_emissions_max,assessed_species",
      "42,Bird Islands,,,,,,,12",
      "",
    ]);
  });
});

describe("areasCsvFilename", () => {
  it("names the file after the local date and time", () => {
    expect(areasCsvFilename(new Date(2026, 0, 5, 9, 3, 7))).toBe(
      "crib-conservation-areas-2026-01-05-090307.csv",
    );
  });
});
