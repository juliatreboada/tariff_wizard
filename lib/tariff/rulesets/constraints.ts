import type { CatalogEntry } from "../catalog/types";
import type { RoutineItem } from "../routine-types";
import { blockSlots, roleForEntry, rowOf } from "./slots";
import type { ElementBlock, Ruleset, RulesHeader } from "./types";

/** Why an element can't go into the routine. */
export type AddProblem =
  | "duplicate"
  | "full"
  | "same-row"
  | "not-allowed"
  | "no-pyramid";

/** Elements already placed, add-ons included. */
function usedCatalogIds(routine: RoutineItem[], exceptItemId?: string): Set<string> {
  const ids = new Set<string>();
  for (const item of routine) {
    if (item.id === exceptItemId) continue;
    ids.add(item.element.catalogId);
    if (item.addOn) ids.add(item.addOn.catalogId);
  }
  return ids;
}

/** The first routine item this add-on can attach to (one add-on per pyramid). */
export function pyramidForAddOn(
  routine: RoutineItem[],
  entry: CatalogEntry,
): RoutineItem | undefined {
  if (!entry.attachesTo) return undefined;
  return routine.find(
    (item) => !item.addOn && entry.attachesTo!.includes(item.element.catalogId),
  );
}

/**
 * Null when `entry` can be added to `block` (or replace `exceptItemId`);
 * otherwise the rule it would break.
 */
export function addProblem(
  ruleset: Ruleset | null,
  header: RulesHeader | null,
  routine: RoutineItem[],
  entry: CatalogEntry,
  block: ElementBlock,
  exceptItemId?: string,
): AddProblem | null {
  if (usedCatalogIds(routine, exceptItemId).has(entry.id)) return "duplicate";
  if (entry.attachesTo) {
    if (exceptItemId) return "not-allowed"; // an add-on can't replace a pyramid
    return pyramidForAddOn(routine, entry) ? null : "no-pyramid";
  }
  if (!ruleset || !header) return null;

  const role = roleForEntry(ruleset, header, entry);
  if (!role) return "not-allowed";
  const slots = blockSlots(ruleset, block, header.category);
  const others = routine.filter(
    (item) => item.block === block && item.role !== "individual" && item.id !== exceptItemId,
  );

  if (ruleset.roleAssignment === "higher-value-compulsory") {
    if (others.length >= slots.compulsory + slots.optional) return "full";
  } else if (others.filter((item) => item.role === role).length >= slots[role]) {
    return "full";
  }

  if (ruleset.compulsoryFromDifferentRows && role === "compulsory") {
    const row = rowOf(entry.coordinates);
    const clash = others.some(
      (item) => item.role === "compulsory" && row !== null && rowOf(item.element.coordinates) === row,
    );
    if (clash) return "same-row";
  }
  return null;
}
