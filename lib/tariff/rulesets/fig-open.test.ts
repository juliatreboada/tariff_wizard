import { describe, expect, it } from "vitest";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import type { CatalogEntry, ElementTag } from "../catalog/types";
import type { Exercise } from "../enums";
import type { RoutineItem } from "../routine-types";
import { header } from "../test-fixtures";
import {
  addProblem,
  catalogSourceOf,
  evaluateRules,
  isLevelAgeReady,
  openDifficulty,
  openDifficultyPenalties,
  openRequirementStatuses,
  rotationQuarters,
  rulesetFor,
} from ".";
import { FIG_JUNIOR, FIG_SENIOR, FIG_YOUTH, RFEG_JUNIOR, RFEG_PRE_JUNIOR, RFEG_SENIOR } from "./fig-open";

/** A sample TOD WG entry (TOD WG isn't in the catalog yet). */
let n = 0;
function tod(
  family: "balance" | "dynamic" | "individual",
  value: number,
  extra: Partial<CatalogEntry> & { tags?: ElementTag[] } = {},
): CatalogEntry {
  return {
    id: `fig-tod-wg-sample-${++n}`,
    code: "FIG",
    elementFamily: family,
    coordinates: `#${n}`,
    image: "tod/sample.png",
    value,
    filters: { levelSystems: ["FIG"], categories: ["Pareja Femenina", "Tríos"], exercises: ["Balance", "Dynamic", "Combined"], levelAges: ["TOD WG"] },
    ...extra,
  };
}

let itemId = 0;
function placed(entry: CatalogEntry, overrides: Partial<RoutineItem> = {}): RoutineItem {
  const block = entry.elementFamily === "individual" ? "combined" : entry.elementFamily;
  return {
    id: `i${++itemId}`,
    block,
    linkedToPrevious: false,
    role: block === "combined" ? "individual" : "compulsory",
    element: catalogEntryToPlaced(entry),
    ...overrides,
  };
}

const fig = (levelAge: string, exercise: Exercise, category = "Pareja Femenina") =>
  header({ levelSystem: "FIG", levelAge, category, exercise });
const rfeg = (levelAge: string, exercise: Exercise, category = "Pareja Femenina") =>
  header({ levelSystem: "RFEG", levelAge, category, exercise });

const byId = (list: ReturnType<typeof openRequirementStatuses>) => Object.fromEntries(list.map((r) => [r.id, r]));

describe("free composition rulesets", () => {
  it("are written but not offered until TOD WG is in the catalog", () => {
    for (const age of ["Youth", "Junior", "Senior"]) {
      expect(rulesetFor({ levelSystem: "FIG", levelAge: age })?.open).toBeDefined();
      expect(isLevelAgeReady("FIG", age)).toBe(false);
    }
    for (const age of ["Pre-Junior", "Junior", "Senior"]) {
      expect(rulesetFor({ levelSystem: "RFEG", levelAge: age })?.open).toBeDefined();
      expect(isLevelAgeReady("RFEG", age)).toBe(false);
    }
  });

  it("reads transverse rotation in quarters", () => {
    expect(rotationQuarters("4/4 BACK")).toBe(4);
    expect(rotationQuarters("0/4 - 180º")).toBe(0);
    expect(rotationQuarters(undefined)).toBeNull();
  });
});

describe("Special Requirements", () => {
  it("pairs balance: 5 elements valued 1+ (1 point each missing) and a handstand", () => {
    const hs = tod("balance", 4, { tags: ["static-hold", "handstand"] });
    const others = [1, 2, 0, 3].map((v) => tod("balance", v, { tags: ["static-hold"] }));
    const routine = [hs, ...others].map((e) => placed(e));
    const status = byId(openRequirementStatuses(FIG_SENIOR, fig("Senior", "Balance"), routine, catalogSourceOf([hs, ...others])));
    expect(status["balance-elements"]).toMatchObject({ actual: 4, met: false, penalty: 1 }); // the 0 doesn't count
    expect(status.handstand).toMatchObject({ actual: 1, met: true, penalty: 0 });
  });

  it("groups balance: pyramids must be of different categories", () => {
    const a = tod("balance", 10, { tags: ["pyramid", "static-hold"], pyramidCategory: "1" });
    const b = tod("balance", 12, { tags: ["pyramid", "static-hold"], pyramidCategory: "1" });
    const status = byId(openRequirementStatuses(FIG_SENIOR, fig("Senior", "Balance", "Tríos"), [placed(a), placed(b)], catalogSourceOf([a, b])));
    expect(status.pyramids).toMatchObject({ actual: 1, met: false, penalty: 1 });
    expect(status["static-holds"]).toMatchObject({ actual: 2, penalty: 1 });
  });

  it("an element built from parts carries every part's tags", () => {
    const base = tod("balance", 5, { tags: ["pyramid"], pyramidCategory: "2" });
    const top = tod("balance", 6, { tags: ["handstand", "static-hold"] });
    const routine = [placed(base, { addOn: catalogEntryToPlaced(top) })];
    const status = byId(openRequirementStatuses(FIG_SENIOR, fig("Senior", "Balance", "Tríos"), routine, catalogSourceOf([base, top])));
    expect(status.handstand.met).toBe(true);
  });

  it("dynamic: 6 flights valued 1+ and 2 catches", () => {
    const flights = Array.from({ length: 6 }, (_, i) => tod("dynamic", 2 + i, { tags: i < 2 ? ["flight", "catch"] : ["flight", "landing"], rotation: "4/4 BACK" }));
    const status = byId(openRequirementStatuses(FIG_SENIOR, fig("Senior", "Dynamic"), flights.map((e) => placed(e)), catalogSourceOf(flights)));
    expect(status.flights.met).toBe(true);
    expect(status.catches.met).toBe(true);
  });

  it("lists a requirement no catalog element can meet yet as pending, not penalised", () => {
    const plain = tod("balance", 3);
    const status = byId(openRequirementStatuses(FIG_SENIOR, fig("Senior", "Balance"), [placed(plain)], catalogSourceOf([plain])));
    expect(status.handstand).toMatchObject({ met: false, pending: true, penalty: 0 });
    expect(status["balance-elements"].pending).toBe(false); // needs no tag
  });

  it("RFEG Júnior and Sénior dynamic: a 4/4 salto, at most 3 landings with 0/4", () => {
    const landings = Array.from({ length: 4 }, () => tod("dynamic", 3, { tags: ["flight", "landing"], rotation: "0/4" }));
    const status = byId(openRequirementStatuses(RFEG_SENIOR, rfeg("Senior", "Dynamic"), landings.map((e) => placed(e)), catalogSourceOf(landings)));
    expect(status["rfeg-salto"]).toMatchObject({ met: false, penalty: 1 });
    expect(status["rfeg-landings"]).toMatchObject({ actual: 4, max: 3, met: false, penalty: 1 });
    expect(FIG_SENIOR.open!.requirements.Dynamic!.pairs.some((r) => r.id === "rfeg-salto")).toBe(false);
  });
});

describe("difficulty", () => {
  it("adds individuals averaged by partners, rounded half up", () => {
    const el = tod("balance", 30, { tags: ["static-hold"] });
    const ind = [tod("individual", 4, { type: "EQ" }), tod("individual", 3, { type: "EQ" })];
    const routine = [placed(el), ...ind.map((e, i) => placed(e, { gymnastRole: i === 0 ? "top" : "base" }))];
    // (4 + 3) / 2 = 3.5 → 4
    expect(openDifficulty(FIG_SENIOR, fig("Senior", "Balance"), routine)).toMatchObject({ balance: 30, individual: 4, total: 34, dScore: 0.34 });
  });

  it("combined: neither balance nor dynamic counts beyond double the other", () => {
    const routine = [placed(tod("balance", 100)), placed(tod("dynamic", 30))];
    expect(openDifficulty(FIG_SENIOR, fig("Senior", "Combined"), routine)).toMatchObject({ balance: 60, dynamic: 30, total: 90 });
  });

  it("combined with no dynamic element: balance counts nothing (CoP 25.2, as written)", () => {
    const routine = [placed(tod("balance", 40))];
    expect(openDifficulty(FIG_SENIOR, fig("Senior", "Combined"), routine)).toMatchObject({ balance: 0, total: 0 });
  });

  it("counts only the first 8 pair/group elements", () => {
    const routine = Array.from({ length: 9 }, () => placed(tod("balance", 10)));
    expect(openDifficulty(FIG_SENIOR, fig("Senior", "Balance"), routine).total).toBe(80);
  });

  it("Youth: counts DV up to the limit, 1 point beyond 20 over", () => {
    const routine = [placed(tod("balance", 60)), placed(tod("balance", 45))];
    const h = fig("Youth", "Balance");
    expect(openDifficulty(FIG_YOUTH, h, routine)).toMatchObject({ total: 105, counted: 90, dScore: 0.9 });
    expect(openDifficultyPenalties(FIG_YOUTH, h, routine).overLimit).toBe(0);
    routine.push(placed(tod("balance", 10)));
    expect(openDifficultyPenalties(FIG_YOUTH, h, routine).overLimit).toBe(1);
    expect(FIG_JUNIOR.open!.difficultyLimit).toEqual({ Balance: 120, Dynamic: 110, Combined: 180 });
  });

  it("RFEG has no difficulty limit: every element adds to DV and D-SCORE", () => {
    const routine = [placed(tod("balance", 100)), placed(tod("balance", 60))];
    for (const ruleset of [RFEG_PRE_JUNIOR, RFEG_JUNIOR, RFEG_SENIOR]) {
      const age = ruleset.levelAges![0]!;
      expect(openDifficulty(ruleset, rfeg(age, "Balance"), routine)).toMatchObject({ total: 160, counted: 160, dScore: 1.6 });
      expect(openDifficultyPenalties(ruleset, rfeg(age, "Balance"), routine).overLimit).toBe(0);
    }
  });

  it("RFEG Júnior: 1 point under the minimum difficulty", () => {
    const routine = [placed(tod("balance", 30))];
    expect(openDifficultyPenalties(RFEG_JUNIOR, rfeg("Junior", "Balance"), routine)).toMatchObject({ underMinimum: 1, minimum: 35 });
    expect(openDifficultyPenalties(RFEG_JUNIOR, rfeg("Junior", "Balance", "Tríos"), routine).minimum).toBe(45);
  });
});

describe("routine limits", () => {
  it("allows at most 8 pair/group elements in the whole routine", () => {
    const h = fig("Senior", "Combined");
    const routine = [...Array.from({ length: 4 }, () => placed(tod("balance", 5))), ...Array.from({ length: 4 }, () => placed(tod("dynamic", 5)))];
    expect(addProblem(FIG_SENIOR, h, routine, tod("dynamic", 5), "dynamic")).toBe("full");
  });

  it("evaluates with requirements instead of compulsory/optional slots", () => {
    const status = evaluateRules(FIG_SENIOR, fig("Senior", "Dynamic"), []);
    expect(status.requirements?.map((r) => r.id)).toEqual(["flights", "catches"]);
    // Flights and catches need TOD WG tags: pending, so nothing is penalised yet.
    expect(status.penaltyTotal).toBe(0);
  });
});
