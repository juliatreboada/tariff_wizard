import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry } from "../catalog/types";
import { useWizardStore } from "../store";
import { header } from "../test-fixtures";
import type { StoredHeader } from "../types";
import { addProblem, evaluateRules, individualProblem, isLevelAgeReady, rulesetFor } from ".";

/** An entry by its full id, or the first option of a cell split into options. */
const find = (code: "RFEG" | "FIG", id: string): CatalogEntry => {
  const found = getCatalogEntries(code).find((e) => e.id === id || e.id === `${id}-a`);
  if (!found) throw new Error(`No ${code} entry ${id}`);
  return found;
};
const espana = (id: string) => find("RFEG", `rfeg-espana-${id}`);
const fig = (id: string) => find("FIG", `fig-pre-youth-${id}`);

const rfeg = (levelAge: string, category = "Pareja Femenina") =>
  header({ levelSystem: "RFEG", levelAge, category });

const store = () => useWizardStore.getState();
const add = (entry: CatalogEntry) => store().addRoutineElement(entry);
const roles = () => store().routine.map((i) => [i.element.catalogId, i.role]);

function startSheet(h: StoredHeader) {
  useWizardStore.setState({ header: h, routine: [], currentSheetId: "s", savedSheets: [] });
}

beforeEach(() => {
  localStorage.clear();
  startSheet(rfeg("Alevín"));
});

describe("availability", () => {
  it("offers RFEG Alevín, Infantil, Cadete (Cto. España) and Juvenil; Pre-Junior and up later", () => {
    expect(rulesetFor({ levelSystem: "RFEG", levelAge: "Cadete" })?.id).toBe("rfeg-espana");
    expect(rulesetFor({ levelSystem: "RFEG", levelAge: "Juvenil" })?.id).toBe("rfeg-juvenil");
    for (const age of ["Alevín", "Infantil", "Cadete", "Juvenil"]) expect(isLevelAgeReady("RFEG", age)).toBe(true);
    for (const age of ["Pre-Junior", "Junior", "Senior"]) {
      expect(isLevelAgeReady("RFEG", age)).toBe(false);
    }
  });
});

describe("Alevín: compulsory from Cto. España Alevín, optional from Cto. España Infantil", () => {
  it("makes Alevín elements compulsory and Infantil's optional", () => {
    expect(add(espana("alevin-pf-balance-row-i-a"))).toBe(true);
    expect(add(espana("alevin-pf-balance-row-iii-d"))).toBe(true);
    expect(add(espana("infantil-pf-balance-row-iv-a"))).toBe(true);
    expect(roles().map(([, role]) => role)).toEqual(["compulsory", "compulsory", "optional"]);
  });

  it("doesn't take Alevín optionals from 11-16, Base or another pair category", () => {
    expect(add(fig("pf-balance-row-i-1"))).toBe(false);
    expect(add(find("RFEG", "rfeg-base-infantil-pairs-balance-row-i-a"))).toBe(false);
    expect(add(espana("infantil-pm-balance-row-i-a"))).toBe(false);
  });

  it("requires compulsory elements from different rows", () => {
    expect(add(espana("alevin-pf-balance-row-i-a"))).toBe(true);
    expect(add(espana("alevin-pf-balance-row-i-c"))).toBe(false);
  });

  it("offers optionals today, so a missing one is penalised", () => {
    const status = evaluateRules(rulesetFor({ levelSystem: "RFEG" }), rfeg("Alevín"), []);
    expect(status.pendingMessages.some((m) => m.startsWith("Elementos opcionales"))).toBe(false);
  });
});

describe("Infantil: optional from Age Group 11-16", () => {
  beforeEach(() => startSheet(rfeg("Infantil", "Tríos")));

  it("makes Cto. España Infantil compulsory and 11-16 optional", () => {
    expect(add(espana("infantil-trios-balance-row-i-a"))).toBe(true);
    expect(add(fig("trios-balance-row-ii-1"))).toBe(true);
    expect(roles().map(([, role]) => role)).toEqual(["compulsory", "optional"]);
  });

  it("doesn't take Infantil optionals from Cto. España Alevín", () => {
    expect(add(espana("alevin-trios-balance-row-i-a"))).toBe(false);
  });
});

describe("Cadete: compulsory from 11-16, optional from another row of the same table", () => {
  beforeEach(() => startSheet(rfeg("Cadete")));

  it("takes all its elements from the 11-16 table, the lowest value optional", () => {
    expect(add(fig("pf-balance-row-i-6"))).toBe(true); // 0.2
    expect(add(fig("pf-balance-row-ii-4"))).toBe(true); // 0.2
    expect(add(fig("pf-balance-row-iii-1"))).toBe(true); // 0
    expect(roles()).toEqual([
      ["fig-pre-youth-pf-balance-row-i-6", "compulsory"],
      ["fig-pre-youth-pf-balance-row-ii-4", "compulsory"],
      ["fig-pre-youth-pf-balance-row-iii-1", "optional"],
    ]);
    expect(add(fig("pf-balance-row-iv-2"))).toBe(false); // block full
  });

  it("needs a different row for every element, the optional included", () => {
    expect(add(fig("pf-balance-row-i-6"))).toBe(true);
    expect(add(fig("pf-balance-row-i-2"))).toBe(false);
    expect(add(fig("pf-balance-row-ii-4"))).toBe(true);
    expect(add(fig("pf-balance-row-ii-1"))).toBe(false);
  });

  it("doesn't take Cto. España tables", () => {
    const h = rfeg("Cadete");
    expect(addProblem(rulesetFor(h), h, [], espana("infantil-pf-balance-row-i-a"), "balance")).toBe("not-allowed");
  });

  it("keeps a horizontal twist (Women's Group ROW I Box 4) compulsory", () => {
    startSheet(rfeg("Cadete", "Tríos"));
    expect(add(fig("trios-dynamic-row-i-4-360"))).toBe(true); // 0.1, can't be optional
    expect(add(fig("trios-dynamic-row-ii-3"))).toBe(true); // 0.2
    expect(add(fig("trios-dynamic-row-iv-5"))).toBe(true); // 0.4
    expect(roles()).toEqual([
      ["fig-pre-youth-trios-dynamic-row-i-4-360", "compulsory"],
      ["fig-pre-youth-trios-dynamic-row-ii-3", "optional"],
      ["fig-pre-youth-trios-dynamic-row-iv-5", "compulsory"],
    ]);
  });

  it("offers optionals today, from its own table", () => {
    const status = evaluateRules(rulesetFor({ levelSystem: "RFEG" }), rfeg("Cadete"), []);
    expect(status.pendingMessages.some((m) => m.startsWith("Elementos opcionales"))).toBe(false);
  });

  it("refuses a second element that can't be optional once the compulsory slots hold them", () => {
    const ruleset = rulesetFor({ levelSystem: "RFEG" });
    const h = rfeg("Cadete", "Tríos");
    // Groups balance has 1 compulsory slot: a pinned element there leaves none for another.
    const pinned = { ...ruleset!, notOptional: { Cadete: ["fig-pre-youth-trios-balance-row-i-5", "fig-pre-youth-trios-balance-row-ii-5"] } };
    startSheet(h);
    expect(add(fig("trios-balance-row-i-5"))).toBe(true);
    expect(addProblem(pinned, h, store().routine, fig("trios-balance-row-ii-5"), "balance")).toBe("not-allowed");
  });
});

describe("optional not from a row holding the same element as a compulsory", () => {
  it("Alevín: Alevín ROW I D is Infantil ROW I B and ROW I C (coach's note)", () => {
    expect(add(espana("alevin-pf-balance-row-i-d"))).toBe(true);
    expect(add(espana("infantil-pf-balance-row-i-a"))).toBe(false); // Infantil ROW I holds it
    expect(add(espana("infantil-pf-balance-row-ii-a"))).toBe(true);
  });

  it("Infantil: Infantil ROW I B is 11-16 ROW I Box 5", () => {
    startSheet(rfeg("Infantil"));
    expect(add(espana("infantil-pf-balance-row-i-b"))).toBe(true);
    expect(add(fig("pf-balance-row-i-1"))).toBe(false); // 11-16 ROW I holds it
    expect(add(fig("pf-balance-row-iii-1"))).toBe(true);
  });
});

describe("individuals", () => {
  it("allows elements valued 1 to 10", () => {
    const ruleset = rulesetFor({ levelSystem: "RFEG" });
    const h = rfeg("Alevín");
    expect(individualProblem(ruleset, h, find("FIG", "fig-tod-balance-018"))).toBeNull(); // 10
    expect(individualProblem(ruleset, h, find("FIG", "fig-tod-ag-123"))).toBe("out-of-range"); // 12
  });
});
