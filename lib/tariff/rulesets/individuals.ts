import { type CatalogFilterHeader, filterCatalogEntries } from "../catalog/filter-catalog";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry, ElementType } from "../catalog/types";
import { gymnastCountForCategory } from "../level-category";
import { gymnastKeysForHeader } from "../routine-groups";
import type { RoutineItem } from "../routine-types";
import type { Ruleset, ValueRange } from "./types";

/** Why an individual element can't be picked. */
export type IndividualProblem = "not-allowed" | "out-of-range";

/** The individual elements this sheet may pick from (all of them, in or out of range). */
export function individualEntries(
  ruleset: Ruleset | null,
  header: CatalogFilterHeader,
  type?: ElementType,
): CatalogEntry[] {
  const source = ruleset?.individuals.source;
  const entries = getCatalogEntries(source?.catalogId ?? ruleset?.catalogId);
  const asSource = source ? { ...header, levelSystem: source.levelSystem } : header;
  return filterCatalogEntries(entries, { header: asSource, elementFamily: "individual", type });
}

/** The value an individual element must have on this sheet, or null for any. */
export function individualValueRange(ruleset: Ruleset | null, levelAge: string): ValueRange | null {
  return ruleset?.individuals.valueRange?.[levelAge] ?? null;
}

/** Null when `entry` can be an individual element on this sheet; otherwise why not. */
export function individualProblem(
  ruleset: Ruleset | null,
  header: CatalogFilterHeader,
  entry: CatalogEntry,
): IndividualProblem | null {
  if (!ruleset) return null;
  if (!individualEntries(ruleset, header).some((e) => e.id === entry.id)) return "not-allowed";
  const range = individualValueRange(ruleset, header.levelAge);
  if (range && (entry.value < range.min || entry.value > range.max)) return "out-of-range";
  return null;
}

/** Gymnasts (top, base-0, …) with no tumbling element yet, when the rules ask for one. */
export function gymnastsWithoutTumbling(
  ruleset: Ruleset | null,
  header: Pick<CatalogFilterHeader, "category"> | null,
  routine: RoutineItem[],
): string[] {
  if (!ruleset?.individuals.requireTumbling || !ruleset.individuals.available || !header) return [];
  const gymnasts = gymnastKeysForHeader(gymnastCountForCategory(header.category) - 1);
  return gymnasts
    .filter(
      (g) =>
        !routine.some(
          (item) =>
            item.role === "individual" &&
            item.gymnastRole === g.role &&
            (g.role === "top" || item.baseIndex === g.baseIndex) &&
            item.element.type === "TUM",
        ),
    )
    .map((g) => g.key);
}
