import type { CatalogEntry } from "./catalog/types";
import type { OfficialSheetBlockId } from "./official-sheet-layout";

/** Map catalog entry to TS block row (balance / dynamic / combined). */
export function inferElementBlock(entry: CatalogEntry): OfficialSheetBlockId {
  if (entry.elementFamily === "dynamic") return "dynamic";
  if (entry.elementFamily === "individual") return "combined";
  return "balance";
}
