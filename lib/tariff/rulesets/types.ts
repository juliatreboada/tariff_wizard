import type { CatalogId } from "../catalog/types";
import type { LevelSystem } from "../enums";

export type ElementBlock = "balance" | "dynamic";

export type BlockSlots = {
  compulsory: number;
  optional: number;
};

/**
 * One competition's rules, as data. Adding a competition = adding a Ruleset
 * (and its catalog), not new `if` branches in the store or UI.
 */
export type Ruleset = {
  id: string;
  /** Short name shown in the routine builder (e.g. ESCOLAR). */
  label: string;
  catalogId: CatalogId;
  /** Sheets whose header has this level system follow this ruleset. */
  levelSystem: LevelSystem;
  /** Ages the wizard offers; the rest of the system's ages show as "coming soon". */
  readyLevelAges: readonly string[];
  /** Elements per balance and dynamic block; pairs and groups (tríos, cuartetos) can differ. */
  blocks: Record<ElementBlock, { pairs: BlockSlots; groups: BlockSlots }>;
  /**
   * How compulsory/optional are chosen within a block:
   * - higher-value-compulsory: any element of the sheet's table; the highest values are compulsory.
   * - by-table: elements from the sheet's own age-group table are compulsory; elements
   *   from an older age group's table (`optionalFromLevelAges`) are optional.
   */
  roleAssignment: "higher-value-compulsory" | "by-table";
  /** Compulsory elements of one block must come from different rows. */
  compulsoryFromDifferentRows: boolean;
  /** by-table: sheet age group → age groups whose tables supply optional elements. */
  optionalFromLevelAges: Readonly<Record<string, readonly string[]>>;
  individuals: {
    /** Individual sets required — and the most allowed. */
    sets: number;
    /** False while the catalog has no individual pictures: not offered, not penalised. */
    available: boolean;
  };
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

/** The header fields the rules depend on. */
export type RulesHeader = { levelAge: string; category: string };
