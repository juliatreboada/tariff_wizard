import { catalogEntryToPlaced } from "./catalog/to-placed";
import { getCatalogEntries } from "./catalog/load-catalog";
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

/** Rehydrate placed elements if catalogId still exists. */
export function refreshRoutineFromCatalog(
  routine: RoutineItem[],
): RoutineItem[] {
  const entries = getCatalogEntries();
  return routine.map((item) => {
    const entry = entries.find((e) => e.id === item.element.catalogId);
    if (entry) {
      return { ...item, element: catalogEntryToPlaced(entry) };
    }
    const image = normalizeLegacyCatalogImage(item.element.image);
    if (image === item.element.image) return item;
    return { ...item, element: { ...item.element, image } };
  });
}
