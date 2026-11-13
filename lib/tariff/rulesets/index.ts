import type { LevelSystem } from "../enums";
import { FGX_ESCOLAR } from "./fgx-escolar";
import { RFEG_BASE } from "./rfeg-base";
import { RFEG_ESPANA } from "./rfeg-espana";
import { FIG_PRE_YOUTH, RFEG_JUVENIL } from "./fig-pre-youth";
import { FIG_JUNIOR, FIG_SENIOR, FIG_YOUTH, RFEG_JUNIOR, RFEG_PRE_JUNIOR, RFEG_SENIOR } from "./fig-open";
import type { Ruleset, RulesetTarget } from "./types";

export const RULESETS: readonly Ruleset[] = [
  FGX_ESCOLAR,
  RFEG_BASE,
  RFEG_ESPANA,
  RFEG_JUVENIL,
  RFEG_PRE_JUNIOR,
  RFEG_JUNIOR,
  RFEG_SENIOR,
  FIG_PRE_YOUTH,
  FIG_YOUTH,
  FIG_JUNIOR,
  FIG_SENIOR,
];

/**
 * The ruleset a sheet follows, or null when its level and age group have no
 * rules yet. Without an age group: the level's first ruleset.
 */
export function rulesetFor(target: RulesetTarget | null | undefined): Ruleset | null {
  if (!target) return null;
  return (
    RULESETS.find(
      (r) =>
        r.levelSystem === target.levelSystem &&
        (target.levelAge === undefined || !r.levelAges || r.levelAges.includes(target.levelAge)),
    ) ?? null
  );
}

/** Level systems the wizard lets coaches pick: those with at least one ready age group. */
export function availableLevelSystems(): LevelSystem[] {
  return [...new Set(RULESETS.filter((r) => r.readyLevelAges.length > 0).map((r) => r.levelSystem))];
}

export function isLevelAgeReady(levelSystem: LevelSystem, levelAge: string): boolean {
  return rulesetFor({ levelSystem, levelAge })?.readyLevelAges.includes(levelAge) ?? false;
}

export { applyRulesetRoles, applyRulesetRolesForBlock } from "./roles";
export { addProblem, pyramidForAddOn, type AddProblem } from "./constraints";
export { evaluateRules, type RuleStatus } from "./evaluate";
export {
  openDifficulty,
  openDifficultyPenalties,
  openRequirementStatuses,
  catalogSourceOf,
  rotationQuarters,
  type OpenDifficulty,
  type OpenRequirementStatus,
} from "./open";
export {
  gymnastsWithoutTumbling,
  individualEntries,
  individualNumber,
  individualProblem,
  repeatsIndividualNumber,
  individualValueRange,
  individualTypes,
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
