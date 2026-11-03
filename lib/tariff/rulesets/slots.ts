import type { CatalogEntry } from "../catalog/types";
import { gymnastCountForCategory } from "../level-category";
import type { RoutineElementRole } from "../routine-types";
import type { BlockSlots, ElementBlock, Ruleset, RulesHeader, TableRef } from "./types";

/** Slots for one block; pairs and groups (tríos, cuartetos) can differ. */
export function blockSlots(
  ruleset: Ruleset,
  block: ElementBlock,
  category: string | undefined,
): BlockSlots {
  const team = category && gymnastCountForCategory(category) > 2 ? "groups" : "pairs";
  return ruleset.blocks[block][team];
}

/** Other tables that supply optional elements for this sheet's age group. */
export function optionalTables(ruleset: Ruleset, levelAge: string): readonly TableRef[] {
  return ruleset.optionalTables[levelAge] ?? ruleset.optionalTables["*"] ?? [];
}

/** False when the rules ask for optional elements the catalog can't offer yet. */
export function optionalAvailable(ruleset: Ruleset, levelAge: string): boolean {
  // higher-value-compulsory: the sheet's own table supplies optionals too.
  return (
    ruleset.roleAssignment === "higher-value-compulsory" ||
    optionalTables(ruleset, levelAge).length > 0
  );
}

/** Table row of an element ("ROW-II C" → "II"), or null for other coordinates. */
export function rowOf(coordinates: string): string | null {
  return coordinates.match(/^ROW-([IVX]+)\b/)?.[1] ?? null;
}

/** The table an entry id belongs to (its id up to the row): same table ⇔ same key. */
export function tableKeyOf(entryId: string): string {
  return entryId.replace(/-row-[ivx]+-.*$/, "");
}

/** Does `entry` belong to this table, in the sheet's category? */
export function entryInTable(entry: CatalogEntry, table: TableRef, category: string): boolean {
  const { filters } = entry;
  return (
    entry.code === table.catalogId &&
    filters.levelSystems.includes(table.levelSystem) &&
    (!filters.levelAges || filters.levelAges.includes(table.levelAge)) &&
    filters.categories.includes(category)
  );
}

/**
 * The role an entry takes on this sheet, or null when the rules don't allow it:
 * the sheet's own table → compulsory (higher-value-compulsory re-derives it from
 * values); an optional table → optional.
 */
export function roleForEntry(
  ruleset: Ruleset,
  header: RulesHeader,
  entry: CatalogEntry,
): Exclude<RoutineElementRole, "individual"> | null {
  const own: TableRef = {
    catalogId: ruleset.catalogId,
    levelSystem: header.levelSystem,
    levelAge: header.levelAge,
  };
  if (entryInTable(entry, own, header.category)) return "compulsory";
  return optionalTables(ruleset, header.levelAge).some((t) =>
    entryInTable(entry, t, header.category),
  )
    ? "optional"
    : null;
}
