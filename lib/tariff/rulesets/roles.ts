import { catalogEntryForElement } from "../catalog/lookup";
import type { RoutineItem } from "../routine-types";
import { fromOwnTable } from "./constraints";
import { blockSlots, isNotOptional, roleAssignmentFor, roleForEntry } from "./slots";
import type { BlockSlots, ElementBlock, Ruleset, RulesHeader } from "./types";

/** Re-derive compulsory/optional for one block. Routines without a ruleset are left as they are. */
export function applyRulesetRolesForBlock(
  routine: RoutineItem[],
  block: ElementBlock,
  ruleset: Ruleset | null,
  header: RulesHeader | null,
): RoutineItem[] {
  if (!ruleset) return routine;
  // A block this routine doesn't have (e.g. balance elements left on a sheet
  // changed to Dynamic): its elements stay but add no difficulty.
  const slots = blockSlots(ruleset, block, header?.category, header?.exercise);
  if (slots.compulsory === 0 && slots.optional === 0) {
    return routine.map((item) =>
      item.block === block && item.role === "compulsory" ? { ...item, role: "optional" } : item,
    );
  }
  switch (header ? roleAssignmentFor(ruleset, header.levelAge) : ruleset.roleAssignment) {
    case "higher-value-compulsory":
      return higherValueCompulsory(routine, block, ruleset, header);
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
 * Elements from an optional table are optional. Among the sheet's own table's
 * elements, the highest values fill the compulsory slots first; the lowest
 * become optional, up to the optional slots left.
 */
function higherValueCompulsory(
  routine: RoutineItem[],
  block: ElementBlock,
  ruleset: Ruleset,
  header: RulesHeader | null,
): RoutineItem[] {
  const slots: BlockSlots = blockSlots(ruleset, block, header?.category, header?.exercise);
  const inBlock = routine
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.block === block && item.role !== "individual");
  if (inBlock.length === 0) return routine;
  const fixedOptional = new Set(
    // Not from the sheet's own table (e.g. Base on an ESCOLAR sheet): always optional.
    inBlock
      .filter(({ item }) => header != null && !fromOwnTable(item, ruleset, header))
      .map(({ index }) => index),
  );
  const indexes = inBlock.filter(({ index }) => !fixedOptional.has(index));
  const optionalCount = Math.min(
    Math.max(0, slots.optional - fixedOptional.size),
    Math.max(0, indexes.length - slots.compulsory),
  );
  // An element that can't be optional (e.g. Cadete's horizontal twists) stays
  // compulsory. Then lowest value first. On a tie keep whichever element is
  // already optional (stable across reorder, replace and reload); otherwise the
  // later one — the newest on add — is optional.
  const pinned = (item: RoutineItem) => {
    const entry = header ? catalogEntryForElement(item.element) : undefined;
    return entry != null && header != null && isNotOptional(ruleset, header.levelAge, entry);
  };
  const byOptionalPreference = [...indexes].sort(
    (a, b) =>
      Number(pinned(a.item)) - Number(pinned(b.item)) ||
      a.item.element.value - b.item.element.value ||
      Number(b.item.role === "optional") - Number(a.item.role === "optional") ||
      b.index - a.index,
  );
  const optional = new Set([
    ...fixedOptional,
    ...byOptionalPreference.slice(0, optionalCount).map(({ index }) => index),
  ]);
  return routine.map((item, i) => {
    if (!inBlock.some((x) => x.index === i)) return item;
    const role = optional.has(i) ? "optional" : "compulsory";
    return role === item.role ? item : { ...item, role };
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
