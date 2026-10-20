import { describe, expect, it } from "vitest";
import { header, individualSet, item } from "../test-fixtures";
import type { RoutineItem } from "../routine-types";
import type { StoredHeader } from "../types";
import { evaluateRules, rulesetFor } from ".";

const evaluate = (h: StoredHeader, routine: RoutineItem[]) =>
  evaluateRules(rulesetFor(h), h, routine);

const fullPairRoutine = () => [
  item("fgx-balance-row-i-c", { role: "compulsory" }),
  item("fgx-balance-row-i-a", { role: "optional" }),
  item("fgx-dynamic-row-i-c", { role: "compulsory" }),
  item("fgx-dynamic-row-i-a", { role: "optional" }),
  ...individualSet("g1", 2),
  ...individualSet("g2", 2),
  ...individualSet("g3", 2),
];

describe("rulesetFor", () => {
  it("finds the ESCOLAR ruleset only for the Escolar level system", () => {
    expect(rulesetFor(header())?.id).toBe("fgx-escolar");
    expect(rulesetFor(header({ levelSystem: "RFEG" }))).toBeNull();
    expect(rulesetFor(null)).toBeNull();
  });
});

describe("evaluateRules", () => {
  it("is disabled with no penalty outside Escolar", () => {
    const status = evaluate(header({ levelSystem: "FIG" }), []);
    expect(status.enabled).toBe(false);
    expect(status.penaltyTotal).toBe(0);
    expect(status.missingMessages).toEqual([]);
  });

  it("gives no penalty for a complete pair routine", () => {
    const status = evaluate(header(), fullPairRoutine());
    expect(status.enabled).toBe(true);
    expect(status.penaltyTotal).toBe(0);
    expect(status.missingMessages).toEqual([]);
    expect(status.individualPerGymnast).toEqual({ expected: 3, actual: 3 });
  });

  it("charges 0.5 per missing element and a flat 1 for missing individuals", () => {
    const status = evaluate(header(), []);
    expect(status.missingCompulsoryBalance).toBe(true);
    expect(status.missingCompulsoryDynamic).toBe(true);
    expect(status.missingOptionalBalance).toBe(true);
    expect(status.missingOptionalDynamic).toBe(true);
    expect(status.missingIndividuals).toBe(true);
    expect(status.penaltyTotal).toBe(0.5 * 4 + 1);
    expect(status.missingMessages).toHaveLength(5);
  });

  it("charges the same 1 point whether one or all individual sets are missing", () => {
    const elements = fullPairRoutine().filter((i) => i.role !== "individual");
    const none = evaluate(header(), elements);
    const twoOfThree = evaluate(header(), [
      ...elements,
      ...individualSet("g1", 2),
      ...individualSet("g2", 2),
    ]);
    expect(none.penaltyTotal).toBe(1);
    expect(twoOfThree.penaltyTotal).toBe(1);
    expect(twoOfThree.individualPerGymnast).toEqual({ expected: 3, actual: 2 });
  });

  it("charges only for the missing optional when one block has a single element", () => {
    const routine = fullPairRoutine().filter(
      (i) => !(i.block === "dynamic" && i.role === "optional"),
    );
    const status = evaluate(header(), routine);
    expect(status.missingOptionalDynamic).toBe(true);
    expect(status.penaltyTotal).toBe(0.5);
  });

  it("does not count an incomplete individual set", () => {
    const elements = fullPairRoutine().filter((i) => i.role !== "individual");
    const topOnly = individualSet("g3", 2).slice(0, 1);
    const status = evaluate(header(), [
      ...elements,
      ...individualSet("g1", 2),
      ...individualSet("g2", 2),
      ...topOnly,
    ]);
    expect(status.individualPerGymnast.actual).toBe(2);
    expect(status.missingIndividuals).toBe(true);
  });

  it("needs every gymnast of a trio in each individual set", () => {
    const trio = header({ category: "Tríos" });
    const elements = [
      item("fgx-trios-balance-row-i-c", { role: "compulsory" }),
      item("fgx-trios-balance-row-i-a", { role: "optional" }),
      item("fgx-trios-dynamic-row-i-c", { role: "compulsory" }),
      item("fgx-trios-dynamic-row-i-a", { role: "optional" }),
    ];
    const pairSized = evaluate(trio, [
      ...elements,
      ...individualSet("g1", 2),
      ...individualSet("g2", 2),
      ...individualSet("g3", 2),
    ]);
    const trioSized = evaluate(trio, [
      ...elements,
      ...individualSet("g1", 3),
      ...individualSet("g2", 3),
      ...individualSet("g3", 3),
    ]);
    expect(pairSized.individualPerGymnast.actual).toBe(0);
    expect(trioSized.penaltyTotal).toBe(0);
  });
});
