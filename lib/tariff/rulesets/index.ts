import type { LevelSystem } from "../enums";
import { FGX_ESCOLAR } from "./fgx-escolar";
import { RFEG_BASE } from "./rfeg-base";
import { RFEG_ESPANA } from "./rfeg-espana";
import type { Ruleset, RulesetTarget } from "./types";

export const RULESETS: readonly Ruleset[] = [FGX_ESCOLAR, RFEG_BASE, RFEG_ESPANA];

/** The ruleset a sheet follows, or null when its level has no rules yet. */
export function rulesetFor(target: RulesetTarget | null | undefined): Ruleset | null {
  if (!target) return null;
  return RULESETS.find((r) => r.levelSystem === target.levelSystem) ?? null;
}

/** Level systems the wizard lets coaches pick. */
export function availableLevelSystems(): LevelSystem[] {
  return RULESETS.map((r) => r.levelSystem);
}

export function isLevelAgeReady(levelSystem: LevelSystem, levelAge: string): boolean {
  return rulesetFor({ levelSystem })?.readyLevelAges.includes(levelAge) ?? false;
}

export { applyRulesetRoles, applyRulesetRolesForBlock } from "./roles";
export { addProblem, pyramidForAddOn, type AddProblem } from "./constraints";
export { evaluateRules, type RuleStatus } from "./evaluate";
export {
  gymnastsWithoutTumbling,
  individualEntries,
  individualNumber,
  individualProblem,
  repeatsIndividualNumber,
  individualValueRange,
  type IndividualProblem,
} from "./individuals";
export {
  blockSlots,
  optionalAvailable,
  optionalCategoryTables,
  optionalTables,
  optionalValueRange,
  ownTable,
  roleAssignmentFor,
  isNotOptional,
  entryInTable,
  tableKeyOf,
  roleForEntry,
  rowOf,
} from "./slots";
export type {
  BlockSlots,
  CategoryTable,
  ElementBlock,
  Ruleset,
  RulesetTarget,
  RulesHeader,
  TableRef,
  TeamBlockRanges,
  ValueRange,
} from "./types";
export {
  RFEG_BASE_OPTIONAL_VALUE_RANGES,
  RFEG_ESPANA_OPTIONAL_VALUE_RANGES,
} from "./optional-value-ranges";
