import type { PlacedElement } from "../sheet-types";
import type { CatalogEntry } from "./types";

export function catalogEntryToPlaced(entry: CatalogEntry): PlacedElement {
  return {
    catalogId: entry.id,
    galicianCode: entry.galicianCode,
    value: entry.value,
    image: entry.image,
    subtype: entry.subtype,
    label: entry.label,
    holdDuration: entry.holdDuration,
    dynamicNotation: entry.dynamicNotation,
  };
}
