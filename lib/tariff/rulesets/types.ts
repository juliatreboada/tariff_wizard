import type { CatalogId } from "../catalog/types";
import type { LevelSystem } from "../enums";

export type ElementBlock = "balance" | "dynamic";

/** One element table: a catalog, level system and age group (e.g. RFEG Base Infantil). */
export type TableRef = {
  catalogId: CatalogId;
  levelSystem: LevelSystem;
  levelAge: string;
  /** Shown in the picker (e.g. "BASE", "Cto. España"). */
  label: string;
  /**
   * The table's categories for a sheet category, when they differ
   * (e.g. Parejas → Pareja Femenina, Masculina, Mixta). Default: the same category.
   */
  categories?: Readonly<Record<string, readonly string[]>>;
};

/** A table for one category: what the picker shows and entries are matched against. */
export type CategoryTable = TableRef & { category: string };

export type BlockSlots = {
  compulsory: number;
  optional: number;
};

/** Inclusive value range, in TOD WG (FIG) / Age Group 11-16 points. */
export type ValueRange = { min: number; max: number };

/** A range per team (pairs; tríos and cuartetos = groups) and block. */
export type TeamBlockRanges = Record<"pairs" | "groups", Record<ElementBlock, ValueRange>>;

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
   * - higher-value-compulsory: among elements of the sheet's own table, the highest
   *   values are compulsory.
   * - by-table: every element of the sheet's own table is compulsory.
   * Either way, an element from an `optionalTables` table is always optional.
   */
  roleAssignment: "higher-value-compulsory" | "by-table";
  /** Compulsory elements of one block must come from different rows. */
  compulsoryFromDifferentRows: boolean;
  /**
   * Sheet age group (or "*" for any) → other tables that supply optional elements,
   * in the sheet's own category (or the table's `categories` for it).
   */
  optionalTables: Readonly<Record<string, readonly TableRef[]>>;
  /**
   * An optional can't come from a row holding the same element (catalog `sameAs`)
   * as one of the block's compulsory elements.
   */
  optionalNotInCompulsoryRow: boolean;
  /**
   * Sheet age group → the value an optional from TOD WG / Age Group 11-16 must
   * have, in their points. Base and Cto. España tables print tenths (0–0,3),
   * not points, so their elements aren't held to it. Absent: no range.
   */
  optionalValueRanges?: Readonly<Record<string, TeamBlockRanges>>;
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
export type RulesHeader = { levelSystem: LevelSystem; levelAge: string; category: string };
