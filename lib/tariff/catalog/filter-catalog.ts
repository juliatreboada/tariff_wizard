import type { StoredHeader } from "../types";
import type { CatalogEntry, ElementFamily, ElementType } from "./types";

/** The header fields catalog filters read. */
export type CatalogFilterHeader = Pick<StoredHeader, "levelSystem" | "levelAge" | "category" | "exercise">;

export type CatalogFilterContext = {
  header: CatalogFilterHeader;
  elementFamily?: ElementFamily;
  type?: ElementType;
};

function matchesFilters(entry: CatalogEntry, header: CatalogFilterHeader): boolean {
  const { filters } = entry;
  return (
    filters.levelSystems.includes(header.levelSystem) &&
    filters.categories.includes(header.category) &&
    filters.exercises.includes(header.exercise) &&
    (!filters.levelAges || filters.levelAges.includes(header.levelAge))
  );
}

export function filterCatalogEntries(
  entries: CatalogEntry[],
  ctx: CatalogFilterContext,
): CatalogEntry[] {
  return entries.filter((entry) => {
    if (ctx.elementFamily && entry.elementFamily !== ctx.elementFamily) {
      return false;
    }
    if (ctx.type && entry.type !== ctx.type) return false;
    return matchesFilters(entry, ctx.header);
  });
}

/** Types that have at least one entry for this header and family. */
export function getAvailableTypes(
  entries: CatalogEntry[],
  header: StoredHeader,
  elementFamily?: ElementFamily,
): ElementType[] {
  const types = new Set<ElementType>();
  for (const entry of entries) {
    if (elementFamily && entry.elementFamily !== elementFamily) continue;
    if (matchesFilters(entry, header) && entry.type) {
      types.add(entry.type);
    }
  }
  return [...types].sort();
}
