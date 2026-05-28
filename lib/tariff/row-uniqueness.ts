import { parseRowColumnFromCoordinates } from "./catalog/coordinates";
import type { ElementFamily } from "./catalog/types";
import type { RoutineItem } from "./routine-types";

/** ROW keys already used in the routine for this family (balance or dynamic only). */
export function rowKeysUsedInRoutine(
  routine: RoutineItem[],
  elementFamily: Extract<ElementFamily, "balance" | "dynamic">,
): Set<string> {
  const keys = new Set<string>();
  for (const item of routine) {
    if (item.block !== elementFamily) continue;
    const parsed = parseRowColumnFromCoordinates(item.element.coordinates);
    if (parsed) keys.add(parsed.rowKey);
  }
  return keys;
}

export function isRowKeyUsedInRoutine(
  routine: RoutineItem[],
  elementFamily: Extract<ElementFamily, "balance" | "dynamic">,
  rowKey: string,
): boolean {
  return rowKeysUsedInRoutine(routine, elementFamily).has(rowKey);
}
