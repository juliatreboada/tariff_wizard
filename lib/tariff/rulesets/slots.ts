import type { CatalogEntry } from "../catalog/types";
import { gymnastCountForCategory } from "../level-category";
import type { RoutineElementRole } from "../routine-types";
import type {
  BlockSlots,
  CategoryTable,
  ElementBlock,
  Ruleset,
  RulesHeader,
  TableRef,
  ValueRange,
} from "./types";

/** Slots for one block; pairs and groups (tríos, cuartetos) can differ. */
export function blockSlots(
  ruleset: Ruleset,
  block: ElementBlock,
  category: string | undefined,
): BlockSlots {
  return ruleset.blocks[block][teamOf(category)];
}

function teamOf(category: string | undefined): "pairs" | "groups" {
  return category && gymnastCountForCategory(category) > 2 ? "groups" : "pairs";
}

/** The value an optional from TOD WG must have (in its points), or null for none. */
export function optionalValueRange(
  ruleset: Ruleset,
  header: Pick<RulesHeader, "levelAge" | "category">,
  block: ElementBlock,
): ValueRange | null {
  return ruleset.optionalValueRanges?.[header.levelAge]?.[teamOf(header.category)][block] ?? null;
}

/** Other tables that supply optional elements for this sheet's age group. */
export function optionalTables(ruleset: Ruleset, levelAge: string): readonly TableRef[] {
  return ruleset.optionalTables[levelAge] ?? ruleset.optionalTables["*"] ?? [];
}

/** The optional tables for this sheet, one per table category (e.g. three pair tables). */
export function optionalCategoryTables(ruleset: Ruleset, header: RulesHeader): CategoryTable[] {
  return optionalTables(ruleset, header.levelAge).flatMap((table) =>
    (table.categories?.[header.category] ?? [header.category]).map((category) => ({
      ...table,
      category,
    })),
  );
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

/** The table an entry id belongs to (its id up to the row or top): same table ⇔ same key. */
export function tableKeyOf(entryId: string): string {
  return entryId.replace(/-(row-[ivx]+|top)-.*$/, "");
}

/** Does `entry` belong to this table, in this category? */
export function entryInTable(
  entry: CatalogEntry,
  table: Omit<TableRef, "label" | "categories">,
  category: string,
): boolean {
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
  const own = {
    catalogId: ruleset.catalogId,
    levelSystem: header.levelSystem,
    levelAge: header.levelAge,
  };
  if (entryInTable(entry, own, header.category)) return "compulsory";
  return optionalCategoryTables(ruleset, header).some((t) => entryInTable(entry, t, t.category))
    ? "optional"
    : null;
}
