import type { RoutineItem } from "./routine-types";

export function isCatalogIdUsedInRoutine(
  routine: RoutineItem[],
  catalogId: string,
  exceptItemId?: string,
): boolean {
  return routine.some(
    (item) => item.id !== exceptItemId && item.element.catalogId === catalogId,
  );
}
