import { describe, expect, it } from "vitest";
import { header } from "../test-fixtures";
import {
  evaluateRules,
  optionalValueRange,
  RFEG_ESPANA_OPTIONAL_VALUE_RANGES,
  rulesetFor,
} from ".";
import { FGX_ESCOLAR } from "./fgx-escolar";
import { RFEG_BASE } from "./rfeg-base";

const base = (levelAge: string, category: string) => ({ levelAge, category });

describe("optional value ranges (TOD WG points)", () => {
  it("follows the Base programme per age group, team and block", () => {
    expect(optionalValueRange(RFEG_BASE, base("Alevín", "Parejas"), "balance")).toEqual({ min: 0, max: 4 });
    expect(optionalValueRange(RFEG_BASE, base("Alevín", "Tríos"), "balance")).toEqual({ min: 0, max: 6 });
    expect(optionalValueRange(RFEG_BASE, base("Infantil", "Cuartetos"), "balance")).toEqual({ min: 0, max: 10 });
    expect(optionalValueRange(RFEG_BASE, base("Infantil", "Parejas"), "dynamic")).toEqual({ min: 0, max: 6 });
    expect(optionalValueRange(RFEG_BASE, base("Cadete", "Parejas"), "balance")).toEqual({ min: 1, max: 6 });
    expect(optionalValueRange(RFEG_BASE, base("Cadete", "Tríos"), "dynamic")).toEqual({ min: 1, max: 8 });
  });

  it("has no range for rulesets or ages without one", () => {
    expect(optionalValueRange(FGX_ESCOLAR, base("Alevín", "Parejas"), "balance")).toBeNull();
    expect(optionalValueRange(RFEG_BASE, base("Junior", "Parejas"), "balance")).toBeNull();
  });

  it("shows the ranges on the checklist's optional requirements", () => {
    const h = header({ levelSystem: "Base", levelAge: "Infantil", category: "Tríos" });
    const status = evaluateRules(rulesetFor(h), h, []);
    expect(status.optionalBalance.valueRange).toEqual({ min: 0, max: 10 });
    expect(status.optionalDynamic.valueRange).toEqual({ min: 0, max: 6 });
    expect(status.compulsoryBalance.valueRange).toBeUndefined();
  });

  it("keeps the 2027 Cto. España ranges for the España ruleset", () => {
    const espana = RFEG_ESPANA_OPTIONAL_VALUE_RANGES;
    expect(espana.Alevín.pairs).toEqual({ balance: { min: 1, max: 8 }, dynamic: { min: 1, max: 12 } });
    expect(espana.Alevín.groups).toEqual({ balance: { min: 1, max: 12 }, dynamic: { min: 1, max: 12 } });
    expect(espana.Infantil.pairs).toEqual({ balance: { min: 1, max: 8 }, dynamic: { min: 1, max: 12 } });
    expect(espana.Infantil.groups).toEqual({ balance: { min: 1, max: 12 }, dynamic: { min: 1, max: 12 } });
    expect(espana.Cadete.pairs).toEqual({ balance: { min: 1, max: 9 }, dynamic: { min: 1, max: 14 } });
    expect(espana.Cadete.groups).toEqual({ balance: { min: 1, max: 16 }, dynamic: { min: 1, max: 14 } });
  });
});
