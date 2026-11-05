import { describe, expect, it } from "vitest";
import { LEVEL_AGE_BY_SYSTEM } from "./enums";
import { renameLegacyLevelAge, usesDvOver100ForDScore } from "./level-category";

describe("ESCOLAR age groups (new season)", () => {
  it("lists the five groups in order", () => {
    expect(LEVEL_AGE_BY_SYSTEM.Escolar).toEqual([
      "Prebenxamín",
      "Benxamín",
      "Alevín",
      "Infantil",
      "Absoluta",
    ]);
  });

  it("divides the D-SCORE by 100 only for Absoluta", () => {
    expect(usesDvOver100ForDScore("Escolar", "Absoluta")).toBe(true);
    expect(usesDvOver100ForDScore("Escolar", "Prebenxamín")).toBe(false);
  });

  it("renames the old Absoluto to Absoluta, and nothing else", () => {
    expect(renameLegacyLevelAge("Escolar", "Absoluto")).toBe("Absoluta");
    expect(renameLegacyLevelAge("Escolar", "Alevín")).toBe("Alevín");
    expect(renameLegacyLevelAge("RFEG", "Absoluto")).toBe("Absoluto");
  });
});
