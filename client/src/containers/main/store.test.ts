import { describe, expect, it } from "vitest";
import { validateAreaListSearch } from "@/containers/main/store";

const validate = (search: Record<string, unknown>) =>
  validateAreaListSearch(search as Parameters<typeof validateAreaListSearch>[0]);

describe("validateAreaListSearch", () => {
  it("keeps known protection types in their canonical order", () => {
    expect(validate({ protection: "aoi,mca" }).protection).toBe("mca,aoi");
  });

  it("drops unknown and repeated protection types", () => {
    expect(validate({ protection: "ebsa,bogus,ebsa" }).protection).toBe("ebsa");
  });

  it("defaults to MCA when the param is missing or not a string", () => {
    expect(validate({}).protection).toBe("mca");
    expect(validate({ protection: 1 }).protection).toBe("mca");
    expect(validate({ protection: ["aoi"] }).protection).toBe("mca");
  });

  it("keeps an empty param as no protection filter", () => {
    expect(validate({ protection: "" }).protection).toBe("");
  });
});
