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
    expect(fig.filter((e) => e.elementFamily !== "individual")).toHaveLength(193);
    expect(count("Pareja Femenina", "balance")).toBe(23);
    expect(count("Pareja Masculina", "dynamic")).toBe(17);
    expect(count("Tríos", "dynamic")).toBe(19); // ROW I Box 4: 360º and 540º/720º
    expect(count("Cuartetos", "balance")).toBe(29); // 11 structures + 18 tops
  });

  it("attaches each Men's Group top only to the structures the coach marked", () => {
    const attach = (n: number) =>
      fig
        .find((e) => e.id === `fig-pre-youth-cuartetos-balance-top-${n}`)!
        .attachesTo!.map((id) => id.replace("fig-pre-youth-cuartetos-balance-", ""));
    expect(attach(13)).toEqual(["row-i-1"]);
    expect(attach(18)).toEqual(["row-ii-3", "row-ii-3b"]);
    expect(attach(1)).toHaveLength(7);
  });

  it("links Base Cadete cells to the same 11-16 element, both ways", () => {
    const rfegCell = getCatalogEntries("RFEG").find(
      (e) => e.id === "rfeg-base-cadete-pairs-balance-row-i-b",
    )!;
    expect(rfegCell.sameAs?.filter((id) => id.startsWith("fig-"))).toEqual([
      "fig-pre-youth-pf-balance-row-i-4",
      "fig-pre-youth-pf-balance-row-i-5",
    ]);
    const figCell = fig.find((e) => e.id === "fig-pre-youth-pf-balance-row-i-5")!;
    expect(figCell.sameAs).toContain("rfeg-base-cadete-pairs-balance-row-i-b");
  });

  it("is only offered at its own level", () => {
    expect(
      filterCatalogEntries(fig, { header: header({ levelSystem: "Base", levelAge: "Cadete" }) }),
    ).toEqual([]);
  });
});

describe("FIG Table of Difficulty individuals", () => {
  const ind = getCatalogEntries("FIG").filter((e) => e.elementFamily === "individual");
  const byId = (id: string) => ind.find((e) => e.id === id)!;

  it("has balance, flexibility, agility and tumbling, coded as on the sheet", () => {
    const count = (type: string) => ind.filter((e) => e.type === type).length;
    expect([count("EQ"), count("FLEX"), count("AG"), count("TUM")]).toEqual([42, 20, 206, 91]);
    expect(byId("fig-tod-balance-018")).toMatchObject({ coordinates: "018", value: 10 });
    expect(byId("fig-tod-flex-078")).toMatchObject({ coordinates: "078", value: 4 });
    expect(byId("fig-tod-ag-101")).toMatchObject({ coordinates: "101", value: 8 });
  });

  it("gives each agility landing its own value", () => {
    expect(byId("fig-tod-ag-124-a")).toMatchObject({ coordinates: "124 A", value: 5 });
    expect(byId("fig-tod-ag-124-f")).toMatchObject({ coordinates: "124 F", value: 12 });
    expect(byId("fig-tod-ag-124-f").variant).toMatchObject({ group: "124", label: "Recepción F" });
    // "116 OR 117" share one box and landing table.
    expect(byId("fig-tod-ag-117-d").value).toBe(byId("fig-tod-ag-116-d").value);
  });

  it("writes tumbling as page 119, valued by column and twist", () => {
    const tum = byId("fig-tod-tum-18-180");
    expect(tum).toMatchObject({ coordinates: "119", value: 33 });
    expect(tum.variant).toMatchObject({ group: "Col. 18", label: "180°" });
  });
});
