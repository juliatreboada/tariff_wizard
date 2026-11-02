import type { PlacedElement } from "../sheet-types";
import { getCatalogEntries } from "./load-catalog";
import { type CatalogEntry, isCatalogId } from "./types";

const byId = new Map<string, Map<string, CatalogEntry>>();

/** The catalog entry a placed element came from, if it still exists. */
export function catalogEntryForElement(element: PlacedElement): CatalogEntry | undefined {
  if (!isCatalogId(element.catalog)) return undefined;
  let entries = byId.get(element.catalog);
  if (!entries) {
    entries = new Map(getCatalogEntries(element.catalog).map((e) => [e.id, e]));
    byId.set(element.catalog, entries);
  }
  return entries.get(element.catalogId);
}
