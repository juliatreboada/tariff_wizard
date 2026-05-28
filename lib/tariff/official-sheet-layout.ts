/**
 * Layout constants from `reference/BASE.xls` / `reference/tariff_example.pdf`.
 */

export const OFFICIAL_MAX_ELEMENT_COLUMNS = 9;
/** Fixed column count on the official TS (always shown). */
export const OFFICIAL_FIXED_COLUMN_COUNT = 9;

export const OFFICIAL_MIN_COLUMNS_PER_BLOCK = OFFICIAL_FIXED_COLUMN_COUNT;
export const OFFICIAL_MIN_BLOCK_COUNT = 2;
export const OFFICIAL_MAX_BLOCK_COUNT = 3;

/** @deprecated Use layout.columnCount from computeSheetLayout */
export const OFFICIAL_ELEMENT_COLUMN_COUNT = OFFICIAL_MAX_ELEMENT_COLUMNS;

export const OFFICIAL_SLOT_SUBCOLS = 4;
export const OFFICIAL_VALUE_SUBCOLS = 4;

/** VALUE row (row 3): balance in subcell 1, dynamic in subcell 2. */
export const OFFICIAL_BALANCE_VALUE_SUBCELL = 0;
export const OFFICIAL_DYNAMIC_VALUE_SUBCELL = 1;

export type OfficialIndividualCoordinateRow = "sh" | "top" | "base";

export const OFFICIAL_SHEET_BLOCKS = [
  { id: "balance" as const },
  { id: "dynamic" as const },
  { id: "combined" as const },
] as const;

export type OfficialSheetBlockId = (typeof OFFICIAL_SHEET_BLOCKS)[number]["id"];

export const OFFICIAL_ROW_LABELS = {
  value: "VALUE",
  sh: "SH",
  top: "TOP",
  base: "BASE",
} as const;

export const OFFICIAL_COMBINED_FOOTER = ["TF:", "SR:", "SIZE:"] as const;
