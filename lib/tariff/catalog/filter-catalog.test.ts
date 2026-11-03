import { describe, expect, it } from "vitest";
import { entry, header } from "../test-fixtures";
import { filterCatalogEntries } from "./filter-catalog";
import { getCatalogEntries } from "./load-catalog";

describe("catalog filters", () => {
  const fgx = entry("fgx-balance-row-i-b");

  it("matches FGX entries for every ESCOLAR age group", () => {
    for (const levelAge of ["Prebenxamín", "Infantil"]) {
      expect(filterCatalogEntries([fgx], { header: header({ levelAge }) })).toEqual([fgx]);
    }
  });

  it("limits an entry with age groups to those ages", () => {
    const alevinOnly = {
      ...fgx,
      filters: { ...fgx.filters, levelSystems: ["Base" as const], levelAges: ["Alevín"] },
    };
    const base = (levelAge: string) =>
      header({ levelSystem: "Base", levelAge, category: "Parejas" });
    expect(filterCatalogEntries([alevinOnly], { header: base("Alevín") })).toHaveLength(1);
    expect(filterCatalogEntries([alevinOnly], { header: base("Cadete") })).toHaveLength(0);
  });
});

describe("RFEG Base catalog", () => {
  const rfeg = getCatalogEntries("RFEG");
  const count = (levelAge: string, category: string, elementFamily: "balance" | "dynamic") =>
    filterCatalogEntries(rfeg, {
      header: header({ levelSystem: "Base", levelAge, category }),
      elementFamily,
    }).length;

  it("has a table per age group, category and family", () => {
    const bySystem = (system: string) =>
      rfeg.filter((e) => e.filters.levelSystems.includes(system as never)).length;
    expect(bySystem("Base")).toBe(253);
    expect(bySystem("RFEG")).toBe(278); // Cto. España tables
    expect(count("Alevín", "Parejas", "balance")).toBe(19);
    expect(count("Infantil", "Tríos", "dynamic")).toBe(15);
    expect(count("Cadete", "Cuartetos", "dynamic")).toBe(15);
  });

  it("is never offered to ESCOLAR sheets", () => {
    expect(filterCatalogEntries(rfeg, { header: header({ levelAge: "Alevín" }) })).toEqual([]);
  });
});
