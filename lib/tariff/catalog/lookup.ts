import type { PlacedElement } from "../sheet-types";
import { getCatalogEntries } from "./load-catalog";
import { type CatalogEntry, isCatalogId } from "./types";

const byId = new Map<string, Map<string, CatalogEntry>>();

/** A catalog entry by catalog and entry id, if it exists. */
export function catalogEntryById(catalog: unknown, id: string): CatalogEntry | undefined {
  if (!isCatalogId(catalog)) return undefined;
  let entries = byId.get(catalog);
  if (!entries) {
    entries = new Map(getCatalogEntries(catalog).map((e) => [e.id, e]));
    byId.set(catalog, entries);
  }
  return entries.get(id);
}

/** The catalog entry a placed element came from, if it still exists. */
export function catalogEntryForElement(element: PlacedElement): CatalogEntry | undefined {
  return catalogEntryById(element.catalog, element.catalogId);
}
