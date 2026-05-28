import type { CatalogEntry } from "./catalog/types";
import type { OfficialSheetBlockId } from "./official-sheet-layout";

/** Map catalog entry to TS block row (balance / dynamic / combined). */
export function inferElementBlock(_entry: CatalogEntry): OfficialSheetBlockId {
  // v1 catalog is balance-only; extend when dynamic catalog exists
  return "balance";
}
