import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry } from "../catalog/types";
import { useWizardStore } from "../store";
import { header } from "../test-fixtures";
import type { StoredHeader } from "../types";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import { addProblem, availableLevelSystems, evaluateRules, isLevelAgeReady, pyramidForAddOn, rulesetFor } from ".";

const rfeg = (id: string): CatalogEntry => {
  const found = getCatalogEntries("RFEG").find((e) => e.id === `rfeg-base-${id}` || e.id === `rfeg-base-${id}` + "-a");
  if (!found) throw new Error(`No RFEG entry ${id}`);
  return found;
};

const base = (levelAge: string, category = "Parejas") =>
  header({ levelSystem: "Base", levelAge, category });

const store = () => useWizardStore.getState();
const add = (id: string) => store().addRoutineElement(rfeg(id));
/** A FIG Pre-Youth (11-16) entry by its id without "fig-pre-youth-". */
const fig = (id: string): CatalogEntry => {
  const found = getCatalogEntries("FIG").find((e) => e.id === `fig-pre-youth-${id}` || e.id === `fig-pre-youth-${id}` + "-a");
  if (!found) throw new Error(`No FIG entry ${id}`);
  return found;
};
const figAdd = (id: string) => store().addRoutineElement(fig(id));
/** Any RFEG entry by its id without the "rfeg-" prefix (e.g. espana-alevin-…). */
const rfegAdd = (id: string) =>
  store().addRoutineElement(getCatalogEntries("RFEG").find((e) => e.id === `rfeg-${id}` || e.id === `rfeg-${id}` + "-a")!);
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
  it("makes own-table elements compulsory and Base Infantil's optional", () => {
    expect(add("alevin-pairs-balance-row-i-b")).toBe(true);
    expect(add("alevin-pairs-balance-row-iv-d")).toBe(true);
    expect(add("infantil-pairs-balance-row-v-a")).toBe(true);
    expect(roles()).toEqual([
      ["alevin-pairs-balance-row-i-b", "compulsory"],
      ["alevin-pairs-balance-row-iv-d", "compulsory"],
      ["infantil-pairs-balance-row-v-a", "optional"],
    ]);
  });

  it("doesn't take Alevín optionals from Base Cadete", () => {
    expect(add("cadete-pairs-balance-row-i-a")).toBe(false);
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
    expect(add("infantil-pairs-balance-row-v-a")).toBe(false); // optional slot taken
  });

  it("requires different rows in Cadete Parejas too", () => {
    startSheet(base("Cadete"));
    expect(add("cadete-pairs-balance-row-ii-a")).toBe(true);
    const h = base("Cadete");
    expect(
      addProblem(rulesetFor(h), h, store().routine, rfeg("cadete-pairs-balance-row-ii-c"), "balance"),
    ).toBe("same-row");
    expect(add("cadete-pairs-balance-row-iii-c")).toBe(true);
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

describe("optionals from the Cto. España tables", () => {
  it("offers the three España pair tables to a Base Parejas sheet", () => {
    expect(add("alevin-pairs-balance-row-ii-b")).toBe(true);
    expect(add("alevin-pairs-balance-row-iv-d")).toBe(true);
    expect(rfegAdd("espana-alevin-pf-balance-row-i-a")).toBe(true);
    expect(roles()[2]).toEqual(["rfeg-espana-alevin-pf-balance-row-i-a", "optional"]);
    store().removeRoutineItem(store().routine[2].id);
    expect(rfegAdd("espana-alevin-pmx-balance-row-i-a")).toBe(true);
  });

  it("refuses an España optional from a row holding a compulsory's same element", () => {
    // Base Alevín ROW II B is España Pareja Masculina ROW I B.
    add("alevin-pairs-balance-row-ii-b");
    expect(rfegAdd("espana-alevin-pm-balance-row-i-a")).toBe(false);
    expect(rfegAdd("espana-alevin-pm-balance-row-ii-a")).toBe(true);
  });

  it("refuses the compulsory when the España optional came first", () => {
    rfegAdd("espana-alevin-pm-balance-row-i-a");
    expect(add("alevin-pairs-balance-row-ii-b")).toBe(false);
  });

  it("takes only the sheet's age group and category from España", () => {
    expect(rfegAdd("espana-infantil-pf-balance-row-i-a")).toBe(false); // Alevín sheet
    expect(rfegAdd("espana-alevin-trios-balance-row-i-a")).toBe(false); // Parejas sheet
    startSheet(base("Infantil", "Tríos"));
    expect(rfegAdd("espana-infantil-trios-dynamic-row-ii-a")).toBe(true);
  });

  it("attaches España Cuartetos ROW III add-ons to their own pyramids", () => {
    startSheet(base("Alevín", "Cuartetos"));
    expect(rfegAdd("espana-alevin-cuartetos-balance-row-i-d")).toBe(true); // optional pyramid
    expect(rfegAdd("espana-alevin-cuartetos-balance-row-iii-a")).toBe(false); // I A only
    expect(rfegAdd("espana-alevin-cuartetos-balance-row-iii-c")).toBe(true);
    expect(store().routine[0].addOn?.coordinates).toBe("ROW-III C");
  });
});

describe("Cadete optionals from the Age Group 11-16 tables", () => {
  beforeEach(() => startSheet(base("Cadete")));

  it("offers the three 11-16 pair tables to Base Cadete Parejas, as optional", () => {
    expect(figAdd("pm-balance-row-ii-3")).toBe(true);
    expect(store().routine[0].role).toBe("optional");
    expect(figAdd("pf-balance-row-i-2")).toBe(false); // optional slot taken
    expect(figAdd("pm-dynamic-row-iv-4")).toBe(true);
  });

  it("is only for Cadete, and only the sheet's category", () => {
    expect(figAdd("trios-balance-row-i-3")).toBe(false); // Parejas sheet
    startSheet(base("Infantil"));
    expect(figAdd("pf-balance-row-i-2")).toBe(false);
  });

  it("maps Tríos to Women's Group and Cuartetos to Men's Group", () => {
    startSheet(base("Cadete", "Tríos"));
    expect(figAdd("trios-dynamic-row-ii-2")).toBe(true);
    startSheet(base("Cadete", "Cuartetos"));
    expect(figAdd("trios-dynamic-row-ii-2")).toBe(false);
    expect(figAdd("cuartetos-dynamic-row-ii-2")).toBe(true);
  });

  it("lets a Women's Group do only one of the two values of ROW I Box 4", () => {
    const box = (v: string) => fig(`trios-dynamic-row-i-4-${v}`);
    expect(box("360").number).toBe("fig-pre-youth-trios-dynamic-row-i-4");
    expect(box("540").number).toBe(box("360").number);
    expect(addProblem(rulesetFor(base("Cadete", "Tríos")), base("Cadete", "Tríos"), [
      { id: "x", block: "dynamic", linkedToPrevious: false, role: "optional", element: catalogEntryToPlaced(box("360")) },
    ], box("540"), "dynamic")).toBe("duplicate");
  });

  it("refuses horizontal 360º/540º/720º twists as Cadete optionals", () => {
    startSheet(base("Cadete", "Tríos"));
    expect(figAdd("trios-dynamic-row-i-4-360")).toBe(false);
    expect(figAdd("trios-dynamic-row-i-4-540")).toBe(false);
    expect(figAdd("trios-dynamic-row-i-3")).toBe(true);
  });

  it("refuses an 11-16 optional from a row holding a compulsory's same element", () => {
    // Base Cadete Parejas ROW I B is 11-16 Pareja Femenina ROW I Box 4 / Box 5.
    expect(add("cadete-pairs-balance-row-i-b")).toBe(true);
    expect(figAdd("pf-balance-row-i-2")).toBe(false);
    expect(figAdd("pm-balance-row-i-2")).toBe(true); // a different pair table
  });

  it("refuses the Base compulsory when the 11-16 optional came first", () => {
    expect(figAdd("pf-balance-row-i-2")).toBe(true);
    expect(add("cadete-pairs-balance-row-i-b")).toBe(false);
    expect(add("cadete-pairs-balance-row-ii-b")).toBe(true);
  });

  it("still takes the top once the compulsory and the optional structure fill the block", () => {
    startSheet(base("Cadete", "Cuartetos"));
    expect(add("cadete-cuartetos-balance-row-ii-a")).toBe(true);
    expect(figAdd("cuartetos-balance-row-ii-2")).toBe(true);
    expect(figAdd("cuartetos-balance-top-15")).toBe(true);
    expect(store().routine.find((i) => i.addOn)?.addOn?.coordinates).toBe("T15");
  });

  it("puts a top only on the structures it belongs to", () => {
    startSheet(base("Cadete", "Cuartetos"));
    expect(figAdd("cuartetos-balance-row-ii-2")).toBe(true);
    expect(figAdd("cuartetos-balance-top-13")).toBe(false); // ROW I Box 1 only
  });

  it("puts a Men's Group top on the optional structure and adds its value", () => {
    startSheet(base("Cadete", "Cuartetos"));
    expect(figAdd("cuartetos-balance-top-15")).toBe(false); // no structure yet
    expect(figAdd("cuartetos-balance-row-ii-2")).toBe(true);
    expect(figAdd("cuartetos-balance-top-15")).toBe(true);
    const [structure] = store().routine;
    expect(structure.role).toBe("optional");
    expect(structure.addOn?.coordinates).toBe("T15");
  });
});

describe("cells with options (several pictures)", () => {
  it("splits a cell into options with the cell's value, coordinates and rules", () => {
    const options = getCatalogEntries("RFEG").filter((e) => e.number === "rfeg-base-cadete-pairs-balance-row-i-b");
    expect(options.map((e) => e.id)).toEqual([
      "rfeg-base-cadete-pairs-balance-row-i-b-a",
      "rfeg-base-cadete-pairs-balance-row-i-b-b",
    ]);
    expect(new Set(options.map((e) => `${e.coordinates} ${e.value}`)).size).toBe(1);
    expect(options[0].variant).toMatchObject({ group: "ROW-I B", label: "Opción A" });
  });

  it("lets a routine use only one option of a cell", () => {
    startSheet(base("Cadete"));
    const option = (l: string) => getCatalogEntries("RFEG").find((e) => e.id === `rfeg-base-cadete-pairs-balance-row-i-b-${l}`)!;
    expect(store().addRoutineElement(option("a"))).toBe(true);
    expect(store().addRoutineElement(option("b"))).toBe(false);
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

  it("costs 1 point per missing element, 1 for missing individuals and 1 for tumbling", () => {
    const status = evaluate(base("Alevín"));
    // 2 + 2 compulsory and 1 + 1 optional missing, plus the individuals and the tumbling.
    expect(status.penaltyTotal).toBe(8);
    expect(status.missingIndividuals).toBe(true);
    expect(status.pendingMessages).toEqual([]);
  });

  it("penalises Cadete's missing optionals now that 11-16 supplies them", () => {
    const status = evaluate(base("Cadete", "Cuartetos"));
    // 1 + 2 compulsory and 1 + 1 optional missing, plus the individuals and the tumbling.
    expect(status.penaltyTotal).toBe(7);
    expect(status.pendingMessages).toEqual([]);
  });

  it("doesn't take ESCOLAR individuals", () => {
    const fgx = getCatalogEntries("FGX").find((e) => e.elementFamily === "individual")!;
    expect(
      store().addIndividualGroup([
        { entry: fgx, gymnastRole: "top" },
        { entry: fgx, gymnastRole: "base", baseIndex: 0 },
      ]),
    ).toBe(false);
  });
});

describe("Base individuals from the FIG Table of Difficulty", () => {
  const evaluate = (h: StoredHeader) => evaluateRules(rulesetFor(h), h, store().routine);
  const tod = (id: string) => {
    const found = getCatalogEntries("FIG").find((e) => e.id === `fig-tod-${id}` || e.id === `fig-tod-${id}` + "-a");
    if (!found) throw new Error(`No ToD entry ${id}`);
    return found;
  };
  const set = (top: string, base0: string) =>
    store().addIndividualGroup([
      { entry: tod(top), gymnastRole: "top" },
      { entry: tod(base0), gymnastRole: "base", baseIndex: 0 },
    ]);

  it("offers the ToD elements and keeps each one within the age group's values", () => {
    // Alevín 1–4: 002 is V 4, 017 is V 8.
    expect(set("balance-002", "balance-001-a")).toBe(true);
    expect(set("balance-017", "balance-001-a")).toBe(false);
    startSheet(base("Cadete"));
    expect(set("balance-017", "balance-001-a")).toBe(true); // Cadete 1–8
  });

  it("asks every gymnast for a tumbling element", () => {
    startSheet(base("Infantil"));
    set("balance-002", "flex-061");
    set("ag-087", "tum-4-0");
    let status = evaluate(base("Infantil"));
    expect(status.missingMessages).toContain("Falta un elemento de tumbling: TOP.");
    expect(status.missingTumbling).toBe(true);
    expect(status.missingIndividuals).toBe(true); // 2 of 3 sets
    set("tum-5-0", "ag-088");
    status = evaluate(base("Infantil"));
    expect(status.missingIndividuals).toBe(false);
    expect(status.missingTumbling).toBe(false);
  });

  it("penalises a missing tumbling on its own, 1 point", () => {
    startSheet(base("Infantil"));
    set("balance-002", "tum-4-0");
    set("balance-001-a", "flex-061");
    set("flex-060", "ag-087");
    const status = evaluate(base("Infantil"));
    expect(status.missingIndividuals).toBe(false); // 3 complete sets
    expect(status.missingTumbling).toBe(true); // the top has none
    // 2 + 2 compulsory and 1 + 1 optional missing, plus the tumbling.
    expect(status.penaltyTotal).toBe(7);
  });

  it("lets a gymnast use an ID number only once, landing or not", () => {
    startSheet(base("Cadete"));
    expect(set("ag-118-a", "ag-118-a")).toBe(true); // top and base may share one
    expect(set("ag-118-c", "balance-001-a")).toBe(false); // top already did 118
    expect(set("balance-001-a", "ag-118-c")).toBe(false); // so did the base
    expect(set("ag-120-c", "ag-119-b")).toBe(true);
    expect(set("ag-120-c", "balance-002")).toBe(false); // the very same element again
  });

  it("replaces a set in place, checking it against the other sets only", () => {
    startSheet(base("Cadete"));
    set("balance-002", "tum-4-0");
    set("ag-118-a", "flex-061");
    const groupId = store().routine[0].individualGroupId!;
    // The set's own 002 doesn't block it.
    expect(
      store().replaceIndividualGroup(groupId, [
        { entry: tod("balance-002"), gymnastRole: "top" },
        { entry: tod("tum-5-0"), gymnastRole: "base", baseIndex: 0 },
      ]),
    ).toBe(true);
    expect(store().routine.slice(0, 2).map((i) => i.element.catalogId)).toEqual([
      "fig-tod-balance-002",
      "fig-tod-tum-5-0",
    ]);
    expect(store().routine[0].individualGroupId).toBe(groupId);
    // The other set's 118 A does (same gymnast, same number).
    expect(
      store().replaceIndividualGroup(groupId, [
        { entry: tod("ag-118-c"), gymnastRole: "top" },
        { entry: tod("tum-5-0"), gymnastRole: "base", baseIndex: 0 },
      ]),
    ).toBe(false);
    expect(store().routine).toHaveLength(4);
  });

  it("lets a gymnast do only one option of a box", () => {
    startSheet(base("Cadete"));
    expect(set("balance-014-a", "balance-014-c")).toBe(true); // different gymnasts
    expect(set("balance-014-b", "balance-002")).toBe(false); // the top already did 014
  });

  it("checks the ID number per base in groups", () => {
    startSheet(base("Cadete", "Tríos"));
    const trio = (top: string, b0: string, b1: string) =>
      store().addIndividualGroup([
        { entry: tod(top), gymnastRole: "top" },
        { entry: tod(b0), gymnastRole: "base", baseIndex: 0 },
        { entry: tod(b1), gymnastRole: "base", baseIndex: 1 },
      ]);
    expect(trio("ag-118-a", "ag-118-a", "balance-001-a")).toBe(true);
    expect(trio("balance-002", "balance-003-a", "ag-118-c")).toBe(true); // base 1 hadn't done 118
    expect(trio("balance-004", "ag-118-d", "flex-060")).toBe(false); // base 0 had
  });

  it("drops landings without a picture in the ToD", () => {
    expect(getCatalogEntries("FIG").some((e) => e.id === "fig-tod-ag-147-g")).toBe(false);
  });

  it("names the group bases that miss their tumbling", () => {
    startSheet(base("Infantil", "Tríos"));
    store().addIndividualGroup([
      { entry: tod("tum-4-0"), gymnastRole: "top" },
      { entry: tod("balance-002"), gymnastRole: "base", baseIndex: 0 },
      { entry: tod("tum-5-0"), gymnastRole: "base", baseIndex: 1 },
    ]);
    expect(evaluate(base("Infantil", "Tríos")).missingMessages).toContain(
      "Falta un elemento de tumbling: BASE 1.",
    );
  });
});

describe("putting an add-on on the chosen pyramid", () => {
  it("uses the pyramid the coach chose, not the first that fits", () => {
    // Alevín Cuartetos ROW III B goes on ROW I A or ROW I B.
    const routine = [
      { id: "a", block: "balance" as const, linkedToPrevious: false, role: "compulsory" as const, element: catalogEntryToPlaced(rfeg("alevin-cuartetos-balance-row-i-a")) },
      { id: "b", block: "balance" as const, linkedToPrevious: false, role: "optional" as const, element: catalogEntryToPlaced(rfeg("alevin-cuartetos-balance-row-i-b")) },
    ];
    const addOn = rfeg("alevin-cuartetos-balance-row-iii-b");
    expect(pyramidForAddOn(routine, addOn)?.id).toBe("a");
    expect(pyramidForAddOn(routine, addOn, "rfeg-base-alevin-cuartetos-balance-row-i-b")?.id).toBe("b");
    expect(pyramidForAddOn(routine, addOn, "rfeg-base-alevin-cuartetos-balance-row-ii-b")).toBeUndefined();
  });

  it("saves the add-on on that pyramid through the store", () => {
    startSheet(base("Cadete", "Cuartetos"));
    expect(figAdd("cuartetos-balance-row-ii-2")).toBe(true);
    const top = fig("cuartetos-balance-top-15");
    expect(store().addRoutineElement(top, { block: "balance", attachTo: "fig-pre-youth-cuartetos-balance-row-ii-5" })).toBe(false);
    expect(store().addRoutineElement(top, { block: "balance", attachTo: "fig-pre-youth-cuartetos-balance-row-ii-2" })).toBe(true);
  });
});
