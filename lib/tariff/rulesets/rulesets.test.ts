import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import { LEVEL_AGE_BY_SYSTEM } from "../enums";
import { header, item } from "../test-fixtures";
import {
  applyRulesetRolesForBlock,
  availableLevelSystems,
  evaluateRules,
  isLevelAgeReady,
  RULESETS,
  type Ruleset,
} from ".";
import { FGX_ESCOLAR } from "./fgx-escolar";

describe("every ruleset", () => {
  it.each(RULESETS.map((r) => [r.id, r] as const))("%s is consistent", (_, r) => {
    expect(getCatalogEntries(r.catalogId).length).toBeGreaterThan(0);
    for (const age of r.readyLevelAges) {
      expect(LEVEL_AGE_BY_SYSTEM[r.levelSystem]).toContain(age);
    }
    expect(r.blocks.maxElements).toBeGreaterThanOrEqual(
      r.blocks.compulsory + r.blocks.optional,
    );
    expect(r.individualSets).toBeGreaterThan(0);
  });

  it("claims a level system no other ruleset claims", () => {
    const systems = RULESETS.map((r) => r.levelSystem);
    expect(new Set(systems).size).toBe(systems.length);
  });
});

describe("wizard availability", () => {
  it("offers only level systems with a ruleset", () => {
    expect(availableLevelSystems()).toEqual(["Escolar"]);
  });

  it("marks ESCOLAR Absoluto as not ready yet", () => {
    expect(isLevelAgeReady("Escolar", "Alevín")).toBe(true);
    expect(isLevelAgeReady("Escolar", "Absoluto")).toBe(false);
    expect(isLevelAgeReady("RFEG", "Junior")).toBe(false);
  });
});

describe("rules come from the config", () => {
  const custom: Ruleset = {
    ...FGX_ESCOLAR,
    id: "custom",
    blocks: { maxElements: 3, compulsory: 2, optional: 1 },
    individualSets: 2,
    penalties: { missingElement: 0.3, missingIndividuals: 2 },
  };

  it("uses the ruleset's requirements and penalties", () => {
    const routine = [
      item("fgx-balance-row-i-c", { role: "compulsory" }),
      item("fgx-balance-row-i-a", { role: "optional" }),
    ];
    const status = evaluateRules(custom, header(), routine);
    // Short: 1 compulsory balance, 2 compulsory + 1 optional dynamic; no individuals.
    expect(status.compulsoryBalance).toEqual({ expected: 2, actual: 1 });
    expect(status.individualPerGymnast.expected).toBe(2);
    expect(status.penaltyTotal).toBeCloseTo(4 * 0.3 + 2);
    expect(status.missingMessages[0]).toBe("Falta 1 obligatorio de equilibrio.");
  });
});

describe("role assignment follows the ruleset's slots", () => {
  const twoAndTwo: Ruleset = {
    ...FGX_ESCOLAR,
    id: "two-and-two",
    blocks: { maxElements: 4, compulsory: 2, optional: 2 },
  };
  const roleOf = (routine: ReturnType<typeof item>[]) =>
    applyRulesetRolesForBlock(routine, "balance", twoAndTwo).map((i) => [
      i.element.value,
      i.role,
    ]);

  it("fills compulsory slots with the highest values first", () => {
    expect(
      roleOf([
        item("fgx-balance-row-i-b"), // 0.1
        item("fgx-balance-row-i-e"), // 0.4
        item("fgx-balance-row-i-a"), // 0
        item("fgx-balance-row-i-d"), // 0.3
      ]),
    ).toEqual([
      [0.1, "optional"],
      [0.4, "compulsory"],
      [0, "optional"],
      [0.3, "compulsory"],
    ]);
  });

  it("makes nothing optional until the compulsory slots are full", () => {
    expect(
      roleOf([item("fgx-balance-row-i-b"), item("fgx-balance-row-i-a")]).map(
        ([, role]) => role,
      ),
    ).toEqual(["compulsory", "compulsory"]);
  });
});
