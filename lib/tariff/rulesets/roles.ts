import type { RoutineItem } from "../routine-types";
import type { Ruleset } from "./types";

type ElementBlock = "balance" | "dynamic";

/** Re-derive compulsory/optional for one block. Routines without a ruleset are left as they are. */
export function applyRulesetRolesForBlock(
  routine: RoutineItem[],
  block: ElementBlock,
  ruleset: Ruleset | null,
): RoutineItem[] {
  if (!ruleset) return routine;
  switch (ruleset.roleAssignment) {
    case "higher-value-compulsory":
      return higherValueCompulsory(routine, block, ruleset.blocks);
  }
}

export function applyRulesetRoles(
  routine: RoutineItem[],
  ruleset: Ruleset | null,
): RoutineItem[] {
  return applyRulesetRolesForBlock(
    applyRulesetRolesForBlock(routine, "balance", ruleset),
    "dynamic",
    ruleset,
  );
}

/**
 * The highest values fill the compulsory slots first; the lowest become
 * optional, up to the ruleset's optional count.
 */
function higherValueCompulsory(
  routine: RoutineItem[],
  block: ElementBlock,
  slots: Ruleset["blocks"],
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
