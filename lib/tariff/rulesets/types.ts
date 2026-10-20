import type { CatalogId } from "../catalog/types";
import type { LevelSystem } from "../enums";

/**
 * One competition's rules, as data. Adding a competition = adding a Ruleset
 * (and its catalog), not new `if` branches in the store or UI.
 */
export type Ruleset = {
  id: string;
  catalogId: CatalogId;
  /** Sheets whose header has this level system follow this ruleset. */
  levelSystem: LevelSystem;
  /** Ages the wizard offers; the rest of the system's ages show as "coming soon". */
  readyLevelAges: readonly string[];
  /** Per balance block and per dynamic block. */
  blocks: {
    maxElements: number;
    compulsory: number;
    optional: number;
  };
  /** How compulsory/optional are chosen within a block. */
  roleAssignment: "higher-value-compulsory";
  /** Individual sets required — and the most allowed. */
  individualSets: number;
  penalties: {
    /** Per missing compulsory or optional element. */
    missingElement: number;
    /** Flat, however many individual sets are missing. */
    missingIndividuals: number;
  };
  display: {
    /** Show "-" instead of individual element values on the sheet. */
    hideIndividualValues: boolean;
  };
};

/** The header fields that pick a ruleset. */
export type RulesetTarget = { levelSystem: LevelSystem };
