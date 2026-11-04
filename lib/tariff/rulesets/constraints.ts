import { catalogEntryByAnyId, catalogEntryForElement } from "../catalog/lookup";
import type { CatalogEntry } from "../catalog/types";
import type { RoutineItem } from "../routine-types";
import { blockSlots, roleForEntry, rowOf, tableKeyOf } from "./slots";
import type { ElementBlock, Ruleset, RulesHeader } from "./types";

/** Why an element can't go into the routine. */
export type AddProblem =
  | "duplicate"
  | "full"
  | "same-row"
  | "not-allowed"
  | "no-pyramid"
  | "same-element-row";

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

/**
 * The routine item this add-on goes on (one add-on per pyramid): the pyramid
 * `attachTo` (its catalog id) when given, otherwise the first it fits.
 */
export function pyramidForAddOn(
  routine: RoutineItem[],
  entry: CatalogEntry,
  attachTo?: string,
): RoutineItem | undefined {
  if (!entry.attachesTo) return undefined;
  return routine.find(
    (item) =>
      !item.addOn &&
      entry.attachesTo!.includes(item.element.catalogId) &&
      (attachTo === undefined || item.element.catalogId === attachTo),
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
  /** For an add-on: the pyramid (catalog id) it must go on. */
  attachTo?: string,
): AddProblem | null {
  if (usedCatalogIds(routine, exceptItemId).has(entry.id)) return "duplicate";
  if (entry.attachesTo) {
    if (exceptItemId) return "not-allowed"; // an add-on can't replace a pyramid
    const pyramid = pyramidForAddOn(routine, entry, attachTo);
    if (!pyramid) return "no-pyramid";
    // The add-on takes its pyramid's role for the row rule.
    if (ruleset?.optionalNotInCompulsoryRow && pyramid.role !== "individual") {
      const otherSide = elementsWithRole(
        routine.filter((i) => i.block === block),
        pyramid.role === "compulsory" ? "optional" : "compulsory",
      );
      const clash = otherSide.some(
        (other) =>
          other &&
          (pyramid.role === "compulsory"
            ? holdsSameElementInRow(entry, other)
            : holdsSameElementInRow(other, entry)),
      );
      if (clash) return "same-element-row";
    }
    return null;
  }
  if (!ruleset || !header) return null;

  const role = roleForEntry(ruleset, header, entry);
  if (!role) return "not-allowed";
  if (role === "optional" && ruleset.notOptional?.[header.levelAge]?.includes(entry.id)) {
    return "not-allowed";
  }
  const slots = blockSlots(ruleset, block, header.category);
  const others = routine.filter(
    (item) => item.block === block && item.role !== "individual" && item.id !== exceptItemId,
  );

  if (ruleset.roleAssignment === "higher-value-compulsory") {
    if (others.length >= slots.compulsory + slots.optional) return "full";
    // An optional-table element needs a free optional slot of its own.
    const fixedOptionals = others.filter((item) => !fromOwnTable(item, ruleset, header)).length;
    if (role === "optional" && fixedOptionals >= slots.optional) return "full";
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

  if (ruleset.optionalNotInCompulsoryRow) {
    const entriesWith = (r: "compulsory" | "optional") =>
      role === r ? [entry] : elementsWithRole(others, r);
    const compulsory = entriesWith("compulsory");
    const optional = entriesWith("optional");
    for (const c of compulsory) {
      for (const o of optional) {
        if (c && o && holdsSameElementInRow(c, o)) return "same-element-row";
      }
    }
  }
  return null;
}

/** Catalog entries of the items with this role, their add-ons included (same role). */
function elementsWithRole(items: RoutineItem[], role: "compulsory" | "optional") {
  return items
    .filter((i) => i.role === role)
    .flatMap((i) => [i.element, ...(i.addOn ? [i.addOn] : [])])
    .map(catalogEntryForElement);
}

/**
 * Is this element from the sheet's own table? Anything else (an optional
 * table's, or one left over after the header changed) is always optional.
 */
export function fromOwnTable(item: RoutineItem, ruleset: Ruleset, header: RulesHeader): boolean {
  const entry = catalogEntryForElement(item.element);
  return entry ? roleForEntry(ruleset, header, entry) === "compulsory" : true;
}

/** Does the optional's row (in its table) hold the same element as the compulsory? */
function holdsSameElementInRow(compulsory: CatalogEntry, optional: CatalogEntry): boolean {
  const row = rowOf(optional.coordinates);
  return (compulsory.sameAs ?? []).some((id) => {
    if (tableKeyOf(id) !== tableKeyOf(optional.id)) return false;
    const same = catalogEntryByAnyId(id); // may be in another catalog
    return same != null && row !== null && rowOf(same.coordinates) === row;
  });
}
