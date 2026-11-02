import { catalogEntryToPlaced } from "./catalog/to-placed";
import { getCatalogEntries } from "./catalog/load-catalog";
import { DEFAULT_CATALOG_ID, isCatalogId } from "./catalog/types";
import { newRoutineItemId } from "./routine-id";
import type { RoutineItem } from "./routine-types";
import type { ElementColumnId, PlacedElement } from "./sheet-types";

/** Legacy persisted grid → ordered routine (unlinked, in column order). */
export function migrateElementsRecordToRoutine(
  elements: Record<ElementColumnId, PlacedElement | undefined>,
): RoutineItem[] {
  const routine: RoutineItem[] = [];
  const colIds = Object.keys(elements)
    .filter((k) => k.startsWith("col-"))
    .sort((a, b) => {
      const na = Number(a.replace("col-", ""));
      const nb = Number(b.replace("col-", ""));
      return na - nb;
    });

  for (const colId of colIds) {
    const placed = elements[colId as ElementColumnId];
    if (!placed) continue;
    routine.push({
      id: newRoutineItemId(),
      block: "balance",
      linkedToPrevious: false,
      element: placed,
    });
  }

  return routine;
}

/** Legacy image paths before `pairs/` wrapper (ESCOLAR parejas layout). */
function normalizeLegacyCatalogImage(image: string): string {
  if (image.startsWith("pairs/") || image.startsWith("individuals/")) {
    return image;
  }
  if (image.startsWith("balance/") || image.startsWith("dynamic/")) {
    return `pairs/${image}`;
  }
  return image;
}

/**
 * Rehydrate placed elements if their catalog entry still exists. Elements
 * saved before `catalog` was recorded are FGX, the only catalog back then.
 */
export function refreshRoutineFromCatalog(
  routine: RoutineItem[],
): RoutineItem[] {
  return routine.map((item) => {
    const saved = item.element.catalog as unknown;
    const catalog = saved == null ? DEFAULT_CATALOG_ID : saved;
    // A catalog this build doesn't know: keep the element as saved.
    if (!isCatalogId(catalog)) return item;
    const entry = getCatalogEntries(catalog).find(
      (e) => e.id === item.element.catalogId,
    );
    if (entry) {
      return { ...item, element: catalogEntryToPlaced(entry) };
    }
    const image = normalizeLegacyCatalogImage(item.element.image);
    if (image === item.element.image && saved === catalog) return item;
    return { ...item, element: { ...item.element, image, catalog } };
  });
}
