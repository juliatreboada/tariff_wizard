import { getCatalogEntries } from "../catalog/load-catalog";
import { catalogEntryForElement } from "../catalog/lookup";
import type { CatalogEntry } from "../catalog/types";
import type { Exercise } from "../enums";
import { gymnastCountForCategory } from "../level-category";
import type { PlacedElement } from "../sheet-types";
import type { RoutineItem } from "../routine-types";
import type { OpenRequirement, Ruleset, RulesHeader, Team } from "./types";

/** Where entries come from: the app's catalogs, or (tests) a list of sample entries. */
export type CatalogSource = { entryOf: (element: PlacedElement) => CatalogEntry | undefined; entries: () => CatalogEntry[] };

function appCatalog(ruleset: Ruleset): CatalogSource {
  return {
    entryOf: catalogEntryForElement,
    // Only the source table's entries (TOD WG), not the rest of its catalog.
    entries: () => {
      const source = ruleset.open?.source;
      if (!source) return [];
      return getCatalogEntries(source.catalogId).filter(
        (e) =>
          e.elementFamily !== "individual" &&
          e.filters.levelSystems.includes(source.levelSystem) &&
          // No age list = every age, as in the catalog filters.
          (!e.filters.levelAges || e.filters.levelAges.includes(source.levelAge)),
      );
    },
  };
}

/** A source from sample entries (tests). */
export function catalogSourceOf(entries: CatalogEntry[]): CatalogSource {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return { entryOf: (el) => byId.get(el.catalogId), entries: () => entries };
}

/** One Special Requirement, as the checklist shows it. */
export type OpenRequirementStatus = {
  id: string;
  label: string;
  min?: number;
  max?: number;
  actual: number;
  met: boolean;
  /** No catalog element can meet it yet (e.g. no TOD WG element carries the tag): listed, not penalised. */
  pending: boolean;
  penalty: number;
};

export type OpenDifficulty = {
  balance: number;
  dynamic: number;
  /** Individual elements, averaged by the number of partners (CoP 27.4). */
  individual: number;
  /** Raw sum of the above, after the combined 2:1 weighting. */
  total: number;
  /** DV counted: `total` up to the routine's limit. */
  counted: number;
  /** D-SCORE: counted / 100. */
  dScore: number;
};

const teamOf = (category: string): Team => (gymnastCountForCategory(category) > 2 ? "groups" : "pairs");

/** Transverse rotation in quarters ("4/4 BACK" → 4, "12/4" → 12), or null. */
export function rotationQuarters(rotation: string | undefined): number | null {
  const m = rotation?.match(/(\d+)\/4/);
  return m ? Number(m[1]) : null;
}

/** The pair/group elements of a routine (add-ons count with their element). */
function pairGroupItems(routine: RoutineItem[]): RoutineItem[] {
  return routine.filter((item) => item.role !== "individual" && (item.block === "balance" || item.block === "dynamic"));
}

/** An element's tags and data, from all its parts (the element and an add-on). */
function describe(item: RoutineItem, source: CatalogSource) {
  const parts = [item.element, ...(item.addOn ? [item.addOn] : [])].map(source.entryOf);
  const main = parts[0];
  return {
    family: item.block as "balance" | "dynamic",
    value: item.element.value + (item.addOn?.value ?? 0),
    tags: new Set(parts.flatMap((p) => p?.tags ?? [])),
    rotation: rotationQuarters(main?.rotation),
    pyramidCategory: main?.pyramidCategory,
  };
}

function matches(req: OpenRequirement, el: ReturnType<typeof describe>): boolean {
  const m = req.match;
  if (m.tag && !el.tags.has(m.tag)) return false;
  if (m.family && el.family !== m.family) return false;
  if (m.minValue !== undefined && el.value < m.minValue) return false;
  if (m.minRotation !== undefined && (el.rotation === null || el.rotation < m.minRotation)) return false;
  if (m.maxRotation !== undefined && (el.rotation === null || el.rotation > m.maxRotation)) return false;
  return true;
}

/** Can any catalog element meet this requirement's tag? */
function tagOffered(req: OpenRequirement, source: CatalogSource): boolean {
  if (!req.match.tag) return true;
  return source.entries().some((e) => e.tags?.includes(req.match.tag!));
}

/** The routine's Special Requirements: what the routine has against each. */
export function openRequirementStatuses(
  ruleset: Ruleset,
  header: RulesHeader & { exercise: Exercise },
  routine: RoutineItem[],
  source: CatalogSource = appCatalog(ruleset),
): OpenRequirementStatus[] {
  const reqs = ruleset.open?.requirements[header.exercise]?.[teamOf(header.category)] ?? [];
  const elements = pairGroupItems(routine).map((item) => describe(item, source));
  return reqs.map((req) => {
    const matching = elements.filter((el) => matches(req, el));
    const actual = req.distinctPyramidCategories
      ? new Set(matching.map((el) => el.pyramidCategory).filter(Boolean)).size
      : matching.length;
    const missing = req.min !== undefined ? Math.max(0, req.min - actual) : 0;
    const extra = req.max !== undefined ? Math.max(0, actual - req.max) : 0;
    const met = missing === 0 && extra === 0;
    const pending = !met && !tagOffered(req, source);
    const short = missing + extra;
    const penalty = met || pending ? 0 : req.penalty.per === "each" ? short * req.penalty.amount : req.penalty.amount;
    return { id: req.id, label: req.label, min: req.min, max: req.max, actual, met, pending, penalty };
  });
}

/**
 * Difficulty of a free-composition routine: every pair/group element, plus the
 * individual elements averaged by partners, with the combined 2:1 weighting,
 * up to the routine's limit.
 */
export function openDifficulty(
  ruleset: Ruleset,
  header: RulesHeader & { exercise: Exercise },
  routine: RoutineItem[],
): OpenDifficulty {
  const open = ruleset.open!;
  let balance = 0;
  let dynamic = 0;
  // Only the first `maxElements` pair/group elements count (CoP 38.7).
  for (const item of pairGroupItems(routine).slice(0, open.maxElements)) {
    const value = item.element.value + (item.addOn?.value ?? 0);
    if (item.block === "balance") balance += value;
    else dynamic += value;
  }
  if (header.exercise === "Combined" && open.combinedWeighting) {
    const b = balance;
    balance = Math.min(balance, 2 * dynamic);
    dynamic = Math.min(dynamic, 2 * b);
  }
  let individual = 0;
  if (open.individualsAddDifficulty) {
    const sum = routine.filter((i) => i.role === "individual").reduce((s, i) => s + i.element.value, 0);
    // Rounded to the nearest whole number, 0.5 up.
    individual = Math.round(sum / gymnastCountForCategory(header.category));
  }
  const total = balance + dynamic + individual;
  const limit = open.difficultyLimit?.[header.exercise];
  const counted = limit === undefined ? total : Math.min(total, limit);
  return { balance, dynamic, individual, total, counted, dScore: counted / 100 };
}

/** Penalties of a free-composition routine besides its Special Requirements: over the limit, under the minimum. */
export function openDifficultyPenalties(
  ruleset: Ruleset,
  header: RulesHeader & { exercise: Exercise },
  routine: RoutineItem[],
): { overLimit: number; underMinimum: number; minimum?: number; limit?: number } {
  const open = ruleset.open!;
  const { total } = openDifficulty(ruleset, header, routine);
  const limit = open.difficultyLimit?.[header.exercise];
  const overLimit =
    limit !== undefined && total > limit + (open.overLimitTolerance ?? 0) ? (open.overLimitPenalty ?? 0) : 0;
  const minimum = open.minDifficulty?.[header.exercise]?.[teamOf(header.category)];
  const underMinimum = minimum !== undefined && total < minimum ? (open.minDifficultyPenalty ?? 0) : 0;
  return { overLimit, underMinimum, minimum, limit };
}
