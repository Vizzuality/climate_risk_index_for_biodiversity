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
  it("sorts the populations by severity, then by name, and takes the most severe status", () => {
    const { populations, cosewicStatus } = buildSarStatus([
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
    expect(cosewicStatus).toBe("Endangered");
  });

  it("sorts unknown statuses last", () => {
    const { populations } = buildSarStatus([
      population("Something new", "A"),
      population("Not at Risk", "B"),
    ]);

    expect(populations.map((p) => p.population)).toEqual(["B", "A"]);
  });

  it("has no status without assessments", () => {
    expect(buildSarStatus([])).toEqual({ populations: [], cosewicStatus: null, saraStatus: null });
  });

  it("takes the most severe SARA listing, which can come from another population", () => {
    const listed = (sara_status: string) => ({ sara_status, sara_schedule: "Schedule 1" });
    const { saraStatus } = buildSarStatus([
      population("Endangered", "A"),
      population("Threatened", "B", listed("Special Concern")),
      population("Special Concern", "C", listed("Threatened")),
    ]);

    expect(saraStatus).toBe("Threatened");
  });

  it("has no SARA status when no population is listed", () => {
    expect(buildSarStatus([population("Endangered", "A")]).saraStatus).toBeNull();
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
