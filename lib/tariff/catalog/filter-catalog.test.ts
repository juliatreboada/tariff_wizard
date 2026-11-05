import { describe, expect, it } from "vitest";
import { entry, header } from "../test-fixtures";
import { filterCatalogEntries } from "./filter-catalog";
import { getCatalogEntries } from "./load-catalog";
import type { CatalogEntry } from "./types";

/** Distinct table cells: options of one cell share its number. */
const cells = (entries: CatalogEntry[]) => new Set(entries.map((e) => e.number ?? e.id)).size;

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
  /** Table cells (a cell's options count once). */
  const count = (levelAge: string, category: string, elementFamily: "balance" | "dynamic") =>
    cells(
      filterCatalogEntries(rfeg, {
        header: header({ levelSystem: "Base", levelAge, category }),
        elementFamily,
      }),
    );

  it("has a table per age group, category and family", () => {
    const bySystem = (system: string) =>
      rfeg.filter((e) => e.filters.levelSystems.includes(system as never)).length;
    expect(bySystem("Base")).toBe(277); // 253 cells, 24 more from cells with options
    expect(bySystem("RFEG")).toBe(318); // Cto. España tables (278 cells, 40 more from cells with options)
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
  /** Table cells (a cell's options count once). */
  const count = (category: string, elementFamily: "balance" | "dynamic") =>
    cells(
      filterCatalogEntries(fig, {
        header: header({ levelSystem: "FIG", levelAge: "Pre-Youth", category }),
        elementFamily,
      }),
    );

  it("has the five 11-16 tables, balance and dynamic", () => {
    expect(fig.filter((e) => e.elementFamily !== "individual")).toHaveLength(232); // with cell options
    expect(count("Pareja Femenina", "balance")).toBe(23);
    expect(count("Pareja Masculina", "dynamic")).toBe(17);
    expect(count("Tríos", "dynamic")).toBe(18); // ROW I Box 4 (360º / 540º-720º) is one cell
    expect(count("Cuartetos", "balance")).toBe(29); // 11 structures + 18 tops
  });

  it("attaches each Men's Group top only to the structures the coach marked", () => {
    const attach = (n: number) =>
      fig
        .find((e) => e.id === `fig-pre-youth-cuartetos-balance-top-${n}` || e.id === `fig-pre-youth-cuartetos-balance-top-${n}` + "-a")!
        .attachesTo!.map((id) => id.replace("fig-pre-youth-cuartetos-balance-", ""));
    expect(attach(13)).toEqual(["row-i-1"]);
    expect(attach(18)).toEqual(["row-ii-3", "row-ii-3b"]);
    expect(attach(1)).toHaveLength(8); // ROW II Box 5 has two options
  });

  it("links Base Cadete cells to the same 11-16 element, both ways", () => {
    const rfegCell = getCatalogEntries("RFEG").find(
      (e) => e.id === "rfeg-base-cadete-pairs-balance-row-i-b-a",
    )!;
    expect(rfegCell.sameAs?.filter((id) => id.startsWith("fig-"))).toEqual([
      "fig-pre-youth-pf-balance-row-i-4",
      "fig-pre-youth-pf-balance-row-i-5",
    ]);
    const figCell = fig.find((e) => e.id === "fig-pre-youth-pf-balance-row-i-5")!;
    // The Base cell has options now: the link goes to each of them.
    expect(figCell.sameAs).toEqual(
      expect.arrayContaining(["rfeg-base-cadete-pairs-balance-row-i-b-a", "rfeg-base-cadete-pairs-balance-row-i-b-b"]),
    );
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
    expect([count("EQ"), count("FLEX"), count("AG"), count("TUM")]).toEqual([53, 25, 207, 92]);
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

  it("splits boxes with several pictures into options, each with its value", () => {
    expect(byId("fig-tod-balance-014-a")).toMatchObject({ coordinates: "014", value: 4, number: "014" });
    expect(byId("fig-tod-balance-014-b").value).toBe(3); // −1
    expect(byId("fig-tod-balance-014-c").value).toBe(5); // +1
    expect(byId("fig-tod-balance-014-c").variant).toMatchObject({ group: "014", groupImage: "tod/balance/014.png" });
    expect(ind.some((e) => e.id === "fig-tod-ag-100-a")).toBe(false); // 100 is one element
    expect(byId("fig-tod-tum-1-0-b")).toMatchObject({ coordinates: "119", number: "119:1:0°" });
  });

  it("writes tumbling as page 119, valued by column and twist", () => {
    const tum = byId("fig-tod-tum-18-180");
    expect(tum).toMatchObject({ coordinates: "119", value: 33 });
    expect(tum.variant).toMatchObject({ group: "Col. 18", label: "180°" });
  });
});
