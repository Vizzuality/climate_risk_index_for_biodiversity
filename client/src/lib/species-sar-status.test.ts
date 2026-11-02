import { describe, expect, it } from "vitest";
import { buildSarStatus, type SarPopulation, saraListing } from "@/lib/species-sar-status";

const population = (
  cosewic_status: string,
  population: string | null = null,
  sara: Pick<SarPopulation, "sara_status" | "sara_schedule"> = {
    sara_status: "No Status",
    sara_schedule: "No schedule",
  },
): SarPopulation => ({
  scientific_name: "Gadus morhua",
  population,
  cosewic_status,
  cosewic_assessed: "2010",
  ...sara,
});

describe("buildSarStatus", () => {
  it("sorts the populations by severity, then by name", () => {
    const { populations, cosewicStatuses } = buildSarStatus([
      population("Special Concern", "Arctic Lakes population"),
      population("Endangered", "Southern population"),
      population("Data Deficient", "Arctic Marine population"),
      population("Endangered", "Laurentian North population"),
    ]);

    expect(populations.map((p) => p.population)).toEqual([
      "Laurentian North population",
      "Southern population",
      "Arctic Lakes population",
      "Arctic Marine population",
    ]);
    expect(cosewicStatuses[0]).toEqual({ status: "Endangered", count: 2 });
  });

  it("counts each status, most common first, then most severe", () => {
    const { cosewicStatuses } = buildSarStatus([
      population("Endangered", "A"),
      population("Not at Risk", "B"),
      population("Not at Risk", "C"),
      population("Special Concern", "D"),
    ]);

    expect(cosewicStatuses).toEqual([
      { status: "Not at Risk", count: 2 },
      { status: "Endangered", count: 1 },
      { status: "Special Concern", count: 1 },
    ]);
  });

  it("sorts unknown statuses last", () => {
    const { populations } = buildSarStatus([
      population("Something new", "A"),
      population("Not at Risk", "B"),
    ]);

    expect(populations.map((p) => p.population)).toEqual(["B", "A"]);
  });

  it("has no status without assessments", () => {
    expect(buildSarStatus([])).toEqual({
      populations: [],
      cosewicStatuses: [],
      saraStatuses: [],
    });
  });

  it("counts the SARA listings, with not listed as null and last on ties", () => {
    const listed = (sara_status: string) => ({ sara_status, sara_schedule: "Schedule 1" });
    const { saraStatuses } = buildSarStatus([
      population("Endangered", "A"),
      population("Threatened", "B", listed("Special Concern")),
      population("Special Concern", "C", listed("Threatened")),
      population("Special Concern", "D", listed("Threatened")),
    ]);

    expect(saraStatuses).toEqual([
      { status: "Threatened", count: 2 },
      { status: "Special Concern", count: 1 },
      { status: null, count: 1 },
    ]);
  });
});

describe("saraListing", () => {
  it("gives the status of populations on Schedule 1", () => {
    expect(
      saraListing(
        population("Endangered", null, { sara_status: "Threatened", sara_schedule: "Schedule 1" }),
      ),
    ).toBe("Threatened");
  });

  it("is null for populations not legally listed", () => {
    expect(saraListing(population("Endangered"))).toBeNull();
    expect(
      saraListing(population("Endangered", null, { sara_status: null, sara_schedule: null })),
    ).toBeNull();
    expect(
      saraListing(
        population("Endangered", null, { sara_status: "No Status", sara_schedule: "Schedule 1" }),
      ),
    ).toBeNull();
  });
});
