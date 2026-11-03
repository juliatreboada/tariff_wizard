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

describe("FIG catalog (Pre-Youth 11-16)", () => {
  const fig = getCatalogEntries("FIG");
  const count = (category: string, elementFamily: "balance" | "dynamic") =>
    filterCatalogEntries(fig, {
      header: header({ levelSystem: "FIG", levelAge: "Pre-Youth", category }),
      elementFamily,
    }).length;

  it("has the five 11-16 tables, balance and dynamic", () => {
    expect(fig).toHaveLength(193);
    expect(count("Pareja Femenina", "balance")).toBe(23);
    expect(count("Pareja Masculina", "dynamic")).toBe(17);
    expect(count("Tríos", "dynamic")).toBe(19); // ROW I Box 4: 360º and 540º/720º
    expect(count("Cuartetos", "balance")).toBe(29); // 11 structures + 18 tops
  });

  it("lets every Men's Group top attach to the ROW I and II structures", () => {
    const top = fig.find((e) => e.id === "fig-pre-youth-cuartetos-balance-top-1")!;
    expect(top.attachesTo).toHaveLength(11);
    expect(top.attachesTo).toContain("fig-pre-youth-cuartetos-balance-row-ii-3b");
  });

  it("is only offered at its own level", () => {
    expect(
      filterCatalogEntries(fig, { header: header({ levelSystem: "Base", levelAge: "Cadete" }) }),
    ).toEqual([]);
  });
});
