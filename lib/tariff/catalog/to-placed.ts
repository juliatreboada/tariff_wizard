import type { PlacedElement } from "../sheet-types";
import type { CatalogEntry } from "./types";

export function catalogEntryToPlaced(entry: CatalogEntry): PlacedElement {
  return {
    catalogId: entry.id,
    coordinates: entry.coordinates,
    value: entry.value,
    image: entry.image,
    ...(entry.type != null ? { type: entry.type } : {}),
    holdDuration: entry.holdDuration,
    rotation: entry.rotation,
  };
}
