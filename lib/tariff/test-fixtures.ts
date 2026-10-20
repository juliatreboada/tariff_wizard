import { getCatalogEntries } from "./catalog/load-catalog";
import type { CatalogEntry } from "./catalog/types";
import type { LevelSystem } from "./enums";
import { baseCountForCategory } from "./level-category";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import type {
  RoutineElementRole,
  RoutineItem,
} from "./routine-types";
import type { StoredHeader } from "./types";

/** Test-only helpers: real FGX catalog entries and headers. */

export function entry(id: string): CatalogEntry {
  const found = getCatalogEntries().find((e) => e.id === id);
  if (!found) throw new Error(`No catalog entry ${id}`);
  return found;
}

export function header(
  overrides: Partial<StoredHeader> & { levelSystem?: LevelSystem } = {},
): StoredHeader {
  const category = overrides.category ?? "Parejas";
  return {
    clubName: "Club Test",
    competition: "Test Cup",
    levelSystem: "Escolar",
    levelAge: "Alevín",
    category,
    exercise: "Combined",
    topName: "Top",
    baseNames: Array.from(
      { length: baseCountForCategory(category) },
      (_, i) => `Base ${i + 1}`,
    ),
    contactName: "Coach",
    contactPhone: "600000000",
    ...overrides,
  };
}

let nextId = 0;

export function item(
  id: string,
  overrides: Partial<RoutineItem> & { role?: RoutineElementRole } = {},
): RoutineItem {
  const e = entry(id);
  const block =
    e.elementFamily === "dynamic"
      ? "dynamic"
      : e.elementFamily === "individual"
        ? "combined"
        : "balance";
  return {
    id: `item-${++nextId}`,
    block,
    linkedToPrevious: false,
    role: block === "combined" ? "individual" : "compulsory",
    element: catalogEntryToPlaced(e),
    ...overrides,
  };
}

/** One complete individual set: top + every base, sharing a group id. */
export function individualSet(
  groupId: string,
  gymnastCount: number,
  entryId = "fgx-individual-eq-1",
): RoutineItem[] {
  return Array.from({ length: gymnastCount }, (_, i) =>
    item(entryId, {
      role: "individual",
      individualGroupId: groupId,
      gymnastRole: i === 0 ? "top" : "base",
      baseIndex: i === 0 ? undefined : i - 1,
      linkedToPrevious: i > 0,
    }),
  );
}
