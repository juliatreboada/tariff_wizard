import type { CatalogEntry } from "../catalog/types";
import { gymnastCountForCategory } from "../level-category";
import type { RoutineElementRole } from "../routine-types";
import type { BlockSlots, ElementBlock, Ruleset, RulesHeader } from "./types";

/** Slots for one block; pairs and groups (tríos, cuartetos) can differ. */
export function blockSlots(
  ruleset: Ruleset,
  block: ElementBlock,
  category: string | undefined,
): BlockSlots {
  const team = category && gymnastCountForCategory(category) > 2 ? "groups" : "pairs";
  return ruleset.blocks[block][team];
}

/** Age groups whose tables supply optional elements for this sheet. */
export function optionalLevelAges(ruleset: Ruleset, levelAge: string): readonly string[] {
  return ruleset.optionalFromLevelAges[levelAge] ?? [];
}

/** False when the rules ask for optional elements the catalog can't offer yet. */
export function optionalAvailable(ruleset: Ruleset, levelAge: string): boolean {
  return ruleset.roleAssignment !== "by-table" || optionalLevelAges(ruleset, levelAge).length > 0;
}

/** Table row of an element ("ROW-II C" → "II"), or null for other coordinates. */
export function rowOf(coordinates: string): string | null {
  return coordinates.match(/^ROW-([IVX]+)\b/)?.[1] ?? null;
}

/**
 * The role an entry takes on this sheet, or null when the rules don't allow it.
 * higher-value-compulsory roles are provisional: they're re-derived from values.
 */
export function roleForEntry(
  ruleset: Ruleset,
  header: RulesHeader,
  entry: CatalogEntry,
): Exclude<RoutineElementRole, "individual"> | null {
  if (ruleset.roleAssignment === "higher-value-compulsory") return "compulsory";
  const ages = entry.filters.levelAges;
  if (!ages || ages.includes(header.levelAge)) return "compulsory";
  const optionalAges = optionalLevelAges(ruleset, header.levelAge);
  return ages.some((age) => optionalAges.includes(age)) ? "optional" : null;
}
