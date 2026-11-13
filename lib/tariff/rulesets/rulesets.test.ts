import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import { LEVEL_AGE_BY_SYSTEM } from "../enums";
import { header, item } from "../test-fixtures";
import {
  applyRulesetRolesForBlock,
  availableLevelSystems,
  entryInTable,
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
    for (const block of [r.blocks.balance, r.blocks.dynamic]) {
      for (const slots of [block.pairs, block.groups]) {
        expect(slots.compulsory).toBeGreaterThan(0);
        expect(slots.optional).toBeGreaterThanOrEqual(0);
      }
    }
    expect(r.individuals.sets).toBeGreaterThan(0);
    for (const [age, tables] of Object.entries(r.optionalTables)) {
      if (age !== "*") expect(r.readyLevelAges).toContain(age);
      for (const t of tables) {
        expect(LEVEL_AGE_BY_SYSTEM[t.levelSystem]).toContain(t.levelAge);
        expect(getCatalogEntries(t.catalogId).length).toBeGreaterThan(0);
        // Every mapped category (e.g. Parejas → Pareja Femenina) has entries in that table.
        for (const categories of Object.values(t.categories ?? {})) {
          for (const category of categories) {
            expect(
              getCatalogEntries(t.catalogId).some((e) => entryInTable(e, t, category)),
            ).toBe(true);
          }
        }
      }
    }
  });

  it("claims each level and age group at most once", () => {
    for (const [system, ages] of Object.entries(LEVEL_AGE_BY_SYSTEM)) {
      for (const age of ages) {
        const claiming = RULESETS.filter(
          (r) => r.levelSystem === system && (!r.levelAges || r.levelAges.includes(age)),
        );
        expect(claiming.length, `${system} ${age}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it.each(RULESETS.map((r) => [r.id, r] as const))("%s keys its per-age settings by ready ages", (_, r) => {
    for (const age of r.readyLevelAges) {
      if (r.levelAges) expect(r.levelAges).toContain(age);
    }
    for (const age of [
      ...Object.keys(r.compulsoryTables ?? {}),
      ...(r.optionalFromOwnTable ?? []),
      ...Object.keys(r.notOptional ?? {}),
      ...Object.keys(r.optionalValueRanges ?? {}),
    ]) {
      expect(r.readyLevelAges).toContain(age);
    }
  });
});

describe("wizard availability", () => {
  it("offers only level systems with a ruleset", () => {
    expect(availableLevelSystems()).toEqual(["Escolar", "Base", "RFEG", "FIG"]);
  });

  it("offers every ESCOLAR age group but Absoluta", () => {
    for (const age of ["Prebenxamín", "Benxamín", "Alevín", "Infantil"]) {
      expect(isLevelAgeReady("Escolar", age)).toBe(true);
    }
    expect(isLevelAgeReady("Escolar", "Absoluta")).toBe(false);
    expect(isLevelAgeReady("RFEG", "Junior")).toBe(false);
  });
});

describe("rules come from the config", () => {
  const custom: Ruleset = {
    ...FGX_ESCOLAR,
    id: "custom",
    blocks: {
      balance: { pairs: { compulsory: 2, optional: 1 }, groups: { compulsory: 2, optional: 1 } },
      dynamic: { pairs: { compulsory: 2, optional: 1 }, groups: { compulsory: 2, optional: 1 } },
    },
    individuals: { sets: 2, available: true },
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
    blocks: {
      ...FGX_ESCOLAR.blocks,
      balance: { pairs: { compulsory: 2, optional: 2 }, groups: { compulsory: 2, optional: 2 } },
    },
  };
  const roleOf = (routine: ReturnType<typeof item>[]) =>
    applyRulesetRolesForBlock(routine, "balance", twoAndTwo, header()).map((i) => [
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
