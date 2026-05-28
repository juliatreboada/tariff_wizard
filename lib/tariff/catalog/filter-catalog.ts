import type { StoredHeader } from "../types";
import type { BalanceSubtype, CatalogEntry } from "./types";

export type CatalogFilterContext = {
  header: StoredHeader;
  subtype?: BalanceSubtype;
};

function matchesFilters(entry: CatalogEntry, header: StoredHeader): boolean {
  const { filters } = entry;
  return (
    filters.levelSystems.includes(header.levelSystem) &&
    filters.categories.includes(header.category) &&
    filters.exercises.includes(header.exercise)
  );
}

export function filterCatalogEntries(
  entries: CatalogEntry[],
  ctx: CatalogFilterContext,
): CatalogEntry[] {
  return entries.filter((entry) => {
    if (entry.elementFamily !== "balance") return false;
    if (ctx.subtype && entry.subtype !== ctx.subtype) return false;
    return matchesFilters(entry, ctx.header);
  });
}

/** Subtypes that have at least one entry for this header. */
export function getAvailableBalanceSubtypes(
  entries: CatalogEntry[],
  header: StoredHeader,
): BalanceSubtype[] {
  const subtypes = new Set<BalanceSubtype>();
  for (const entry of entries) {
    if (matchesFilters(entry, header)) {
      subtypes.add(entry.subtype);
    }
  }
  return [...subtypes].sort();
}
