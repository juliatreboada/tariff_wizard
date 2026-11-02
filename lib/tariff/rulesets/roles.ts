import { catalogEntryForElement } from "../catalog/lookup";
import type { RoutineItem } from "../routine-types";
import { blockSlots, roleForEntry } from "./slots";
import type { BlockSlots, ElementBlock, Ruleset, RulesHeader } from "./types";

/** Re-derive compulsory/optional for one block. Routines without a ruleset are left as they are. */
export function applyRulesetRolesForBlock(
  routine: RoutineItem[],
  block: ElementBlock,
  ruleset: Ruleset | null,
  header: RulesHeader | null,
): RoutineItem[] {
  if (!ruleset) return routine;
  switch (ruleset.roleAssignment) {
    case "higher-value-compulsory":
      return higherValueCompulsory(
        routine,
        block,
        blockSlots(ruleset, block, header?.category),
      );
    case "by-table":
      return header ? byTable(routine, block, ruleset, header) : routine;
  }
}

export function applyRulesetRoles(
  routine: RoutineItem[],
  ruleset: Ruleset | null,
  header: RulesHeader | null,
): RoutineItem[] {
  return applyRulesetRolesForBlock(
    applyRulesetRolesForBlock(routine, "balance", ruleset, header),
    "dynamic",
    ruleset,
    header,
  );
}

/**
 * The highest values fill the compulsory slots first; the lowest become
 * optional, up to the ruleset's optional count.
 */
function higherValueCompulsory(
  routine: RoutineItem[],
  block: ElementBlock,
  slots: BlockSlots,
): RoutineItem[] {
  const indexes = routine
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.block === block && item.role !== "individual");
  if (indexes.length === 0) return routine;
  const optionalCount = Math.min(
    slots.optional,
    Math.max(0, indexes.length - slots.compulsory),
  );
  // Lowest value first. On a tie keep whichever element is already optional
  // (stable across reorder, replace and reload); otherwise the later one — the
  // newest on add — is optional.
  const byOptionalPreference = [...indexes].sort(
    (a, b) =>
      a.item.element.value - b.item.element.value ||
      Number(b.item.role === "optional") - Number(a.item.role === "optional") ||
      b.index - a.index,
  );
  const optional = new Set(
    byOptionalPreference.slice(0, optionalCount).map(({ index }) => index),
  );
  return routine.map((item, i) => {
    if (!indexes.some((x) => x.index === i)) return item;
    return { ...item, role: optional.has(i) ? "optional" : "compulsory" };
  });
}

/**
 * Own age-group table → compulsory; an older age group's table → optional.
 * An element this sheet's age group can't use (e.g. after the header changed)
 * becomes optional, so it adds no difficulty.
 */
function byTable(
  routine: RoutineItem[],
  block: ElementBlock,
  ruleset: Ruleset,
  header: RulesHeader,
): RoutineItem[] {
  return routine.map((item) => {
    if (item.block !== block || item.role === "individual") return item;
    const entry = catalogEntryForElement(item.element);
    // An element whose entry is gone keeps the role it was saved with.
    const role = entry ? (roleForEntry(ruleset, header, entry) ?? "optional") : item.role;
    return role !== item.role ? { ...item, role } : item;
  });
}
