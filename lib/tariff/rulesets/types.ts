import type { CatalogId, ElementTag, ElementType } from "../catalog/types";
import type { Exercise, LevelSystem } from "../enums";

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

/** Inclusive value range, in TOD WG (FIG) points. */
export type ValueRange = { min: number; max: number };

/**
 * A range per team (pairs; tríos and cuartetos = groups) and block, with
 * optional overrides per sheet category (e.g. Cuartetos dynamic: up to 10).
 */
export type TeamBlockRanges = Record<"pairs" | "groups", Record<ElementBlock, ValueRange>> & {
  categories?: Readonly<Record<string, Partial<Record<ElementBlock, ValueRange>>>>;
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
  /**
   * The level's age groups this ruleset covers (e.g. FIG Pre-Youth); absent: all
   * of them. Several rulesets can share a level system with different ages.
   */
  levelAges?: readonly string[];
  /** Ages the wizard offers; the rest of the system's ages show as "coming soon". */
  readyLevelAges: readonly string[];
  /**
   * Routines a sheet can be (header EXERCISE). Absent: the level's default (a
   * combined routine where D = DV). A Balance sheet has only its balance block,
   * a Dynamic sheet only its dynamic block.
   */
  exercises?: readonly Exercise[];
  /** Highest D-SCORE the compulsory elements can give (e.g. 0.5 in Pre-Youth); absent: no cap. */
  difficultyCap?: number;
  /** Free composition from TOD WG (Youth, Junior, Senior) instead of compulsory/optional tables. */
  open?: OpenComposition;
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
  /**
   * Sheet age group → the table compulsory elements come from, when it isn't the
   * sheet's own level and age (e.g. RFEG Cadete: FIG Age Group 11-16).
   */
  compulsoryTables?: Readonly<Record<string, TableRef>>;
  /**
   * Age groups whose own table also supplies the optional element, from a
   * different row (e.g. RFEG Cadete). There the block's own-table elements are
   * assigned like higher-value-compulsory, and they all need different rows.
   */
  optionalFromOwnTable?: readonly string[];
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
   * Sheet age group → the value an optional from TOD WG (or the 11-16 optional
   * elements appendix) must have, in their points. Base, Cto. España and 11-16
   * compulsory tables print tenths, not points, so their elements aren't held
   * to it. Absent: no range.
   */
  optionalValueRanges?: Readonly<Record<string, TeamBlockRanges>>;
  /** Sheet age group → entries that can't be optional (e.g. horizontal 360º/540º/720º twists). */
  notOptional?: Readonly<Record<string, readonly string[]>>;
  individuals: {
    /** Individual sets required — and the most allowed. */
    sets: number;
    /** False while the catalog has no individual pictures: not offered, not penalised. */
    available: boolean;
    /** Where the individual elements come from; default: the ruleset's own catalog and level. */
    source?: { catalogId: CatalogId; levelSystem: LevelSystem };
    /** Sheet age group → the value each individual element must have (e.g. 1–4). */
    valueRange?: Readonly<Record<string, ValueRange>>;
    /** Each gymnast must perform at least one tumbling element. */
    requireTumbling?: boolean;
    /** Routine → the individual element types allowed in it (e.g. Dynamic: tumbling only). Absent: all. */
    typesByExercise?: Readonly<Partial<Record<Exercise, readonly ElementType[]>>>;
  };
  penalties: {
    /** Per missing compulsory or optional element. */
    missingElement: number;
    /** Flat, however many individual sets are missing. */
    missingIndividuals: number;
    /** Flat, when a gymnast has no tumbling element (`individuals.requireTumbling`). */
    missingTumbling?: number;
  };
  display: {
    /** Show "-" instead of individual element values on the sheet. */
    hideIndividualValues: boolean;
  };
};

/** Teams the Code of Points separates: pairs; tríos and cuartetos = groups. */
export type Team = "pairs" | "groups";

/**
 * A Special Requirement of a free-composition routine: how many pair/group
 * elements must (min) or may (max) match, and the penalty.
 */
export type OpenRequirement = {
  id: string;
  /** Shown in the checklist (Spanish). */
  label: string;
  /** Which elements count; all conditions must hold. */
  match: {
    tag?: ElementTag;
    family?: ElementBlock;
    minValue?: number;
    /** Transverse rotation, in quarters (from the entry's rotation, e.g. "4/4 BACK" = 4). */
    minRotation?: number;
    maxRotation?: number;
  };
  min?: number;
  max?: number;
  /** Matching elements must have different `pyramidCategory` to count. */
  distinctPyramidCategories?: boolean;
  /** "each": per missing (or extra) element; "once": once if not met. */
  penalty: { amount: number; per: "each" | "once" };
};

/**
 * A free-composition routine (FIG Youth, Junior, Senior): pair/group
 * elements from TOD WG, every one adding difficulty, checked against Special
 * Requirements instead of compulsory/optional slots.
 */
export type OpenComposition = {
  /** Where pair/group elements come from (TOD WG). */
  source: TableRef;
  /** Most pair/group elements counted for difficulty in a routine (CoP 17.5: 8). */
  maxElements: number;
  /** Routine → highest DV counted (Youth: Balance 90, …); absent: open (Senior). */
  difficultyLimit?: Readonly<Partial<Record<Exercise, number>>>;
  /** A 1.0 penalty when DV goes more than this above the limit (20). */
  overLimitTolerance?: number;
  overLimitPenalty?: number;
  /** Routine → team → minimum DV (RFEG Júnior, Sénior); 1 point when not reached. */
  minDifficulty?: Readonly<Partial<Record<Exercise, Record<Team, number>>>>;
  minDifficultyPenalty?: number;
  /** Routine → team → Special Requirements. */
  requirements: Readonly<Partial<Record<Exercise, Record<Team, readonly OpenRequirement[]>>>>;
  /** Up to `individuals.sets` per gymnast, not required; their values, averaged by partners, add difficulty (CoP 27.4). */
  individualsAddDifficulty: boolean;
  /** Combined: neither balance nor dynamic DV counts beyond double the other (CoP 25.2). */
  combinedWeighting: boolean;
};

/** The header fields that pick a ruleset (without an age: the level's first ruleset). */
export type RulesetTarget = { levelSystem: LevelSystem; levelAge?: string };

/** The header fields the rules depend on. */
export type RulesHeader = {
  levelSystem: LevelSystem;
  levelAge: string;
  category: string;
  /** The routine; absent: combined (both blocks). */
  exercise?: Exercise;
};
