import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry } from "../catalog/types";
import type { Exercise } from "../enums";
import { exerciseOptionsForLevel } from "../exercise-display";
import { useWizardStore } from "../store";
import { header } from "../test-fixtures";
import type { StoredHeader } from "../types";
import {
  addProblem,
  evaluateRules,
  individualProblem,
  isLevelAgeReady,
  optionalValueRange,
  rulesetFor,
} from ".";

const find = (id: string): CatalogEntry => {
  const found = getCatalogEntries("FIG").find((e) => e.id === id || e.id === `${id}-a`);
  if (!found) throw new Error(`No FIG entry ${id}`);
  return found;
};
const fig = (id: string) => find(`fig-pre-youth-${id}`);

const preYouth = (exercise: Exercise, category = "Pareja Femenina") =>
  header({ levelSystem: "FIG", levelAge: "Pre-Youth", category, exercise });
const juvenil = (exercise: Exercise, category = "Pareja Femenina") =>
  header({ levelSystem: "RFEG", levelAge: "Juvenil", category, exercise });

const store = () => useWizardStore.getState();
const add = (entry: CatalogEntry) => store().addRoutineElement(entry);
const roles = () => store().routine.map((i) => i.role);

function startSheet(h: StoredHeader) {
  useWizardStore.setState({ header: h, routine: [], currentSheetId: "s", savedSheets: [] });
}

beforeEach(() => {
  localStorage.clear();
  startSheet(preYouth("Balance"));
});

describe("availability", () => {
  it("offers FIG Pre-Youth and RFEG Juvenil; Youth, Junior and Senior later", () => {
    expect(isLevelAgeReady("FIG", "Pre-Youth")).toBe(true);
    expect(isLevelAgeReady("RFEG", "Juvenil")).toBe(true);
    for (const age of ["Youth", "Junior", "Senior"]) expect(isLevelAgeReady("FIG", age)).toBe(false);
  });

  it("has a Balance and a Dynamic routine, no combined one", () => {
    expect(exerciseOptionsForLevel("FIG", "Pre-Youth")).toEqual(["Balance", "Dynamic"]);
    expect(exerciseOptionsForLevel("RFEG", "Juvenil")).toEqual(["Balance", "Dynamic"]);
    expect(exerciseOptionsForLevel("RFEG", "Alevín")).toEqual(["Combined"]);
  });

  it("caps D-SCORE at 0.5 in FIG Pre-Youth but not in RFEG Juvenil", () => {
    expect(rulesetFor(preYouth("Balance"))?.difficultyCap).toBe(0.5);
    expect(rulesetFor(juvenil("Balance"))?.difficultyCap).toBeUndefined();
  });
});

describe("Balance routine", () => {
  it("takes 4 compulsory pair elements, one per row", () => {
    expect(add(fig("pf-balance-row-i-1"))).toBe(true);
    expect(add(fig("pf-balance-row-i-2"))).toBe(false); // same row
    expect(add(fig("pf-balance-row-ii-1"))).toBe(true);
    expect(add(fig("pf-balance-row-iii-1"))).toBe(true);
    expect(add(fig("pf-balance-row-iv-1"))).toBe(true);
    expect(roles()).toEqual(["compulsory", "compulsory", "compulsory", "compulsory"]);
  });

  it("has no dynamic block", () => {
    expect(add(fig("pf-dynamic-row-i-1"))).toBe(false);
  });

  it("takes 2 compulsory pyramids from different rows in groups", () => {
    startSheet(preYouth("Balance", "Tríos"));
    expect(add(fig("trios-balance-row-i-1"))).toBe(true);
    expect(add(fig("trios-balance-row-ii-1"))).toBe(true);
    expect(add(fig("trios-balance-row-iii-2"))).toBe(false); // 2 compulsory slots
  });

  it("asks for 4 compulsory, shows TOD WG optionals as coming soon", () => {
    const status = evaluateRules(rulesetFor(preYouth("Balance")), preYouth("Balance"), []);
    expect(status.compulsoryBalance.expected).toBe(4);
    expect(status.compulsoryDynamic.expected).toBe(0);
    expect(status.optionalBalance.expected).toBe(0);
    expect(status.pendingMessages.some((m) => m.startsWith("Elementos opcionales"))).toBe(true);
    // 4 missing compulsory + missing individuals.
    expect(status.penaltyTotal).toBe(5);
  });

  it("allows flexibility, balance and agility individuals, not tumbling", () => {
    const ruleset = rulesetFor(preYouth("Balance"));
    const tumbling = getCatalogEntries("FIG").find((e) => e.elementFamily === "individual" && e.type === "TUM" && e.value <= 10)!;
    expect(individualProblem(ruleset, preYouth("Balance"), find("fig-tod-balance-018"))).toBeNull();
    expect(individualProblem(ruleset, preYouth("Balance"), tumbling)).toBe("not-allowed");
    expect(individualProblem(ruleset, preYouth("Dynamic"), tumbling)).toBeNull();
    expect(individualProblem(ruleset, preYouth("Dynamic"), find("fig-tod-balance-018"))).toBe("not-allowed");
    expect(individualProblem(ruleset, preYouth("Balance"), find("fig-tod-ag-123"))).toBe("out-of-range"); // 12
  });
});

describe("Dynamic routine", () => {
  beforeEach(() => startSheet(preYouth("Dynamic", "Tríos")));

  it("takes 4 compulsory group elements, one per row, and no balance", () => {
    expect(add(fig("trios-balance-row-i-1"))).toBe(false);
    for (const row of ["i-1", "ii-1", "iii-2", "iv-1"]) expect(add(fig(`trios-dynamic-row-${row}`))).toBe(true);
    expect(add(fig("trios-dynamic-row-iv-2"))).toBe(false);
    expect(roles()).toEqual(["compulsory", "compulsory", "compulsory", "compulsory"]);
  });

  it("holds Men's Group dynamic optionals to 1–10, Women's to 1–14", () => {
    const ruleset = rulesetFor(preYouth("Dynamic"))!;
    expect(optionalValueRange(ruleset, preYouth("Dynamic", "Cuartetos"), "dynamic")).toEqual({ min: 1, max: 10 });
    expect(optionalValueRange(ruleset, preYouth("Dynamic", "Tríos"), "dynamic")).toEqual({ min: 1, max: 14 });
    expect(optionalValueRange(ruleset, preYouth("Balance", "Tríos"), "balance")).toEqual({ min: 4, max: 16 });
  });
});

describe("RFEG Juvenil", () => {
  it("takes its compulsory elements from the 11-16 table", () => {
    startSheet(juvenil("Dynamic"));
    expect(add(fig("pf-dynamic-row-i-1"))).toBe(true);
    expect(add(fig("pf-dynamic-row-ii-1"))).toBe(true);
    expect(roles()).toEqual(["compulsory", "compulsory"]);
  });

  it("doesn't take Cto. España tables", () => {
    const h = juvenil("Balance");
    const espana = getCatalogEntries("RFEG").find((e) => e.id.startsWith("rfeg-espana-infantil-pf-balance"))!;
    expect(addProblem(rulesetFor(h), h, [], espana, "balance")).toBe("not-allowed");
  });

  it("stops counting elements of a block the routine no longer has", () => {
    startSheet(juvenil("Balance"));
    add(fig("pf-balance-row-i-1"));
    add(fig("pf-balance-row-ii-2"));
    useWizardStore.setState({ competition: { ...store().competition, ...juvenil("Dynamic") } });
    store().commitHeader();
    expect(roles()).toEqual(["optional", "optional"]);
    expect(store().valueBreakdown.total).toBe(0);
  });
});
