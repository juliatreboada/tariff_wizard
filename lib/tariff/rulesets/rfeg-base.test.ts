import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry } from "../catalog/types";
import { useWizardStore } from "../store";
import { header } from "../test-fixtures";
import type { StoredHeader } from "../types";
import { availableLevelSystems, evaluateRules, isLevelAgeReady, rulesetFor } from ".";

const rfeg = (id: string): CatalogEntry => {
  const found = getCatalogEntries("RFEG").find((e) => e.id === `rfeg-base-${id}`);
  if (!found) throw new Error(`No RFEG entry ${id}`);
  return found;
};

const base = (levelAge: string, category = "Parejas") =>
  header({ levelSystem: "Base", levelAge, category });

const store = () => useWizardStore.getState();
const add = (id: string) => store().addRoutineElement(rfeg(id));
const roles = () =>
  store().routine.map((i) => [i.element.catalogId.replace("rfeg-base-", ""), i.role]);

function startSheet(h: StoredHeader) {
  useWizardStore.setState({ header: h, routine: [], currentSheetId: "s", savedSheets: [] });
}

beforeEach(() => {
  localStorage.clear();
  startSheet(base("Alevín"));
});

describe("availability", () => {
  it("offers Base Alevín, Infantil and Cadete", () => {
    expect(availableLevelSystems()).toEqual(["Escolar", "Base"]);
    for (const age of ["Alevín", "Infantil", "Cadete"]) {
      expect(isLevelAgeReady("Base", age)).toBe(true);
    }
    expect(isLevelAgeReady("Base", "Junior")).toBe(false);
  });
});

describe("Base pairs: 2 compulsory + 1 optional per block", () => {
  it("makes own-table elements compulsory and older age groups' optional", () => {
    expect(add("alevin-pairs-balance-row-i-b")).toBe(true);
    expect(add("alevin-pairs-balance-row-iv-d")).toBe(true);
    expect(add("cadete-pairs-balance-row-i-a")).toBe(true);
    expect(roles()).toEqual([
      ["alevin-pairs-balance-row-i-b", "compulsory"],
      ["alevin-pairs-balance-row-iv-d", "compulsory"],
      ["cadete-pairs-balance-row-i-a", "optional"],
    ]);
  });

  it("requires compulsory elements from different rows", () => {
    expect(add("alevin-pairs-dynamic-row-ii-b")).toBe(true);
    expect(add("alevin-pairs-dynamic-row-ii-d")).toBe(false);
    expect(add("alevin-pairs-dynamic-row-iii-d")).toBe(true);
  });

  it("allows only 2 compulsory and 1 optional", () => {
    add("alevin-pairs-balance-row-i-b");
    add("alevin-pairs-balance-row-ii-b");
    expect(add("alevin-pairs-balance-row-iii-b")).toBe(false);
    expect(add("infantil-pairs-balance-row-iv-a")).toBe(true);
    expect(add("cadete-pairs-balance-row-iv-a")).toBe(false);
  });

  it("refuses elements from the same or a younger age group's table as optional", () => {
    startSheet(base("Infantil"));
    expect(add("alevin-pairs-balance-row-i-d")).toBe(false);
    expect(add("cadete-pairs-balance-row-i-d")).toBe(true);
    expect(roles()).toEqual([["cadete-pairs-balance-row-i-d", "optional"]]);
  });

  it("adds only compulsory values to the difficulty", () => {
    add("alevin-pairs-balance-row-i-d"); // 0.3
    add("alevin-pairs-balance-row-ii-c"); // 0.2
    add("infantil-pairs-balance-row-v-d"); // optional 0.3
    expect(store().valueBreakdown.balance).toBeCloseTo(0.5);
  });
});

describe("changing the header", () => {
  it("re-derives roles: an element the new age group can't use adds no difficulty", () => {
    useWizardStore.setState({ competition: { ...store().competition, ...base("Alevín") } });
    add("alevin-pairs-balance-row-i-d");
    add("infantil-pairs-balance-row-i-d"); // optional for Alevín
    useWizardStore.setState({
      competition: { ...store().competition, levelAge: "Infantil" },
      teamContact: { ...store().teamContact, topName: "Top", baseNames: ["Base 1"] },
    });
    store().commitHeader();
    expect(roles()).toEqual([
      ["alevin-pairs-balance-row-i-d", "optional"],
      ["infantil-pairs-balance-row-i-d", "compulsory"],
    ]);
    expect(store().savedSheets[0].routine.map((i) => i.role)).toEqual(["optional", "compulsory"]);
  });
});

describe("same element in an optional's row", () => {
  // Alevín Parejas dynamic ROW I C is the same element as Infantil ROW I B.
  it("refuses an optional from a row holding the same element as a compulsory", () => {
    expect(add("alevin-pairs-dynamic-row-i-c")).toBe(true);
    expect(add("infantil-pairs-dynamic-row-i-c")).toBe(false); // Infantil ROW I has I B
    expect(add("infantil-pairs-dynamic-row-ii-b")).toBe(true);
  });

  it("refuses the compulsory too when the optional came first", () => {
    expect(add("infantil-pairs-dynamic-row-i-d")).toBe(true);
    expect(add("alevin-pairs-dynamic-row-i-c")).toBe(false);
    expect(add("alevin-pairs-dynamic-row-ii-c")).toBe(true);
  });
});

describe("same element through Cuartetos add-ons", () => {
  // Alevín Cuartetos ROW III B is the same element as Infantil ROW III A.
  beforeEach(() => startSheet(base("Alevín", "Cuartetos")));

  it("refuses an optional add-on in the row of a compulsory add-on's same element", () => {
    add("alevin-cuartetos-balance-row-i-b");
    add("alevin-cuartetos-balance-row-iii-b");
    add("infantil-cuartetos-balance-row-i-a"); // optional pyramid
    expect(add("infantil-cuartetos-balance-row-iii-a")).toBe(false);
  });

  it("refuses the compulsory add-on when the optional one came first", () => {
    add("infantil-cuartetos-balance-row-i-a");
    add("infantil-cuartetos-balance-row-iii-a");
    add("alevin-cuartetos-balance-row-i-b");
    expect(add("alevin-cuartetos-balance-row-iii-b")).toBe(false);
  });
});

describe("Base groups", () => {
  it("allows 1 compulsory + 1 optional balance, 2 + 1 dynamic", () => {
    startSheet(base("Infantil", "Tríos"));
    expect(add("infantil-trios-balance-row-i-b")).toBe(true);
    expect(add("infantil-trios-balance-row-ii-b")).toBe(false);
    expect(add("infantil-trios-dynamic-row-i-b")).toBe(true);
    expect(add("infantil-trios-dynamic-row-ii-b")).toBe(true);
  });
});

describe("Cuartetos ROW III add-ons", () => {
  beforeEach(() => startSheet(base("Cadete", "Cuartetos")));

  it("needs one of its pyramids in the routine", () => {
    expect(add("cadete-cuartetos-balance-row-iii-c")).toBe(false);
    add("cadete-cuartetos-balance-row-ii-d");
    expect(add("cadete-cuartetos-balance-row-iii-a")).toBe(false); // attaches to ROW I C only
    expect(add("cadete-cuartetos-balance-row-iii-c")).toBe(true);
  });

  it("shares the pyramid's cell and adds its value", () => {
    add("cadete-cuartetos-balance-row-ii-d"); // 0.3
    add("cadete-cuartetos-balance-row-iii-d"); // + 0.3
    expect(store().routine).toHaveLength(1);
    expect(store().routine[0].addOn?.coordinates).toBe("ROW-III D");
    expect(store().valueBreakdown.balance).toBeCloseTo(0.6);
  });

  it("allows one add-on per pyramid and goes when the pyramid goes", () => {
    add("cadete-cuartetos-balance-row-ii-d");
    add("cadete-cuartetos-balance-row-iii-c");
    expect(add("cadete-cuartetos-balance-row-iii-d")).toBe(false);
    store().removeRoutineItem(store().routine[0].id);
    expect(store().routine).toEqual([]);
  });

  it("is dropped when the pyramid is replaced by one it can't attach to", () => {
    add("cadete-cuartetos-balance-row-ii-d");
    add("cadete-cuartetos-balance-row-iii-c");
    const id = store().routine[0].id;
    expect(store().replaceRoutineElement(id, rfeg("cadete-cuartetos-balance-row-i-d"))).toBe(true);
    expect(store().routine[0].addOn?.coordinates).toBe("ROW-III C");
    expect(store().replaceRoutineElement(id, rfeg("cadete-cuartetos-balance-row-i-a"))).toBe(true);
    expect(store().routine[0].addOn).toBeUndefined();
  });

  it("can be removed on its own", () => {
    add("cadete-cuartetos-balance-row-ii-d");
    add("cadete-cuartetos-balance-row-iii-c");
    store().removeAddOn(store().routine[0].id);
    expect(store().routine[0].addOn).toBeUndefined();
    expect(store().valueBreakdown.balance).toBeCloseTo(0.3);
  });
});

describe("Base checklist and penalties", () => {
  const evaluate = (h: StoredHeader) => evaluateRules(rulesetFor(h), h, []);

  it("costs 1 point per missing element; individuals are coming soon", () => {
    const status = evaluate(base("Alevín"));
    // 2 + 2 compulsory and 1 + 1 optional missing.
    expect(status.penaltyTotal).toBe(6);
    expect(status.missingIndividuals).toBe(false);
    expect(status.pendingMessages).toEqual(["Elementos individuales: próximamente."]);
  });

  it("doesn't penalise Cadete's optional elements until higher tables exist", () => {
    const status = evaluate(base("Cadete", "Cuartetos"));
    // 1 balance + 2 dynamic compulsory missing.
    expect(status.penaltyTotal).toBe(3);
    expect(status.pendingMessages[0]).toMatch(/opcionales: próximamente/i);
  });

  it("doesn't offer individual sets yet", () => {
    expect(store().addIndividualGroup([])).toBe(false);
    const fgx = getCatalogEntries("FGX").find((e) => e.elementFamily === "individual")!;
    expect(
      store().addIndividualGroup([
        { entry: fgx, gymnastRole: "top" },
        { entry: fgx, gymnastRole: "base", baseIndex: 0 },
      ]),
    ).toBe(false);
  });
});
