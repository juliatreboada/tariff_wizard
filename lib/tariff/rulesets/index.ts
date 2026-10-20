import type { LevelSystem } from "../enums";
import { FGX_ESCOLAR } from "./fgx-escolar";
import type { Ruleset, RulesetTarget } from "./types";

export const RULESETS: readonly Ruleset[] = [FGX_ESCOLAR];

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
export { evaluateRules, type RuleStatus } from "./evaluate";
export type { Ruleset, RulesetTarget } from "./types";
