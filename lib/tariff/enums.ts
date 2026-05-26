/**
 * Federation lists for level, category, and exercise.
 *
 * v1: constants in code (easy to learn, no database).
 * Later: move to DB/admin only if lists change often without redeploying.
 */

/** First part of LEVEL — competition system */
export const LEVEL_SYSTEMS = ["Base", "Escolar", "RFEG", "FIG"] as const;
export type LevelSystem = (typeof LEVEL_SYSTEMS)[number];

/** Second part of LEVEL — age band within the system */
export const LEVEL_AGE_BY_SYSTEM = {
  Escolar: ["Benxamín", "Alevín", "Infantil", "Absoluto"],
  Base: ["Alevín", "Infantil", "Cadete", "Junior", "Senior"],
  RFEG: [
    "Alevín",
    "Infantil",
    "Cadete",
    "Juvenil",
    "Pre-Junior",
    "Junior",
    "Senior",
  ],
  FIG: ["Cadete", "Pre-Youth", "Youth", "Junior", "Senior"],
} as const satisfies Record<LevelSystem, readonly string[]>;

export type LevelAge<S extends LevelSystem = LevelSystem> =
  (typeof LEVEL_AGE_BY_SYSTEM)[S][number];

/** Routine type for the sheet header (EXERCISE field) */
export const EXERCISES = ["Balance", "Dynamic", "Combined"] as const;
export type Exercise = (typeof EXERCISES)[number];

/** Category labels when level system is Escolar or Base */
export const CATEGORIES_ESCOLAR_BASE = [
  "Parejas",
  "Tríos",
  "Cuartetos",
] as const;

/** Category labels for RFEG / FIG */
export const CATEGORIES_FEDERATION = [
  "Pareja Femenina",
  "Pareja Masculina",
  "Pareja Mixta",
  "Tríos",
  "Cuartetos",
] as const;

export type CategoryEscolarBase = (typeof CATEGORIES_ESCOLAR_BASE)[number];
export type CategoryFederation = (typeof CATEGORIES_FEDERATION)[number];

/**
 * Short codes used on some sheets / programs (optional display alias).
 * Stored in app state as `categoryCode`; full label in `category`.
 */
export const CATEGORY_CODES = {
  W2: "Pareja Femenina",
  M2: "Pareja Masculina",
  Mx2: "Pareja Mixta",
  W3: "Tríos",
  M4: "Cuartetos",
} as const;

export type CategoryCode = keyof typeof CATEGORY_CODES;

/**
 * Rows under VALUE on the template — subtotals by element type.
 * Not the same as EXERCISE (routine type for the whole sheet).
 */
export const VALUE_BREAKDOWN_ROWS = [
  "Balance",
  "Dynamic",
  "Individual",
] as const;
export type ValueBreakdownRow = (typeof VALUE_BREAKDOWN_ROWS)[number];

/** Sheet labels for VALUE_BREAKDOWN_ROWS (uppercase on PDF) */
export const VALUE_BREAKDOWN_LABELS: Record<ValueBreakdownRow, string> = {
  Balance: "BALANCE",
  Dynamic: "DYNAMIC",
  Individual: "INDIVIDUAL",
};
