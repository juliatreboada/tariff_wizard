/**
 * TOD WG (Women's Group balance) rules over the reviewed catalog data:
 * which top tables a base can use, the top's value for the base's group,
 * motions and transitions. See docs/CATALOG.md for the data files.
 *
 * Picker flow: base → top step(s) → support table → top position (value for
 * the base's group) → optional motion; between two pyramids, a transition.
 */
import basesData from "@/catalog/FIG/tod-wg-bases.json";
import topsData from "@/catalog/FIG/tod-wg-tops.json";
import transitionsData from "@/catalog/FIG/tod-wg-transitions.json";

export type BaseGroup = 1 | 2 | 3 | 4;

export type TodWgBase = {
  id: string;
  number: string;
  page: number;
  category: number;
  row: string;
  box: string;
  option?: string;
  value: number;
  group: number;
  image: string;
  variationOf?: string;
  note?: string;
  topIncluded?: boolean;
  /** Points of support the middle can give the top. */
  supports?: string[];
  /** Category 2: points of support for the middle acting as a top. */
  supportsMiddle?: string[];
};

type Values = [number | null, number | null, number | null, number | null];
type ImageRef = { image: string; role?: string };
type TopPosition = {
  id: string;
  values?: Values;
  images?: ImageRef[];
  options?: { option: string; image: string; values: Values }[];
  notOnSupport?: string[];
};
type TopTable = {
  page: number;
  layout: "wheel" | "grid";
  support: { image: string; support: string; croppedFromPage?: boolean }[];
  positions: Record<string, TopPosition>;
  motions?: Record<string, { id: string; values: Values }>;
};

const BASES = basesData.bases as TodWgBase[];
const TABLES = topsData.tables as unknown as Record<string, TopTable>;
/** Printed TOD page of the transitions table (how a transition is written on the sheet). */
export const TRANSITIONS_PAGE: number = transitionsData.page;

const TRANSITIONS = transitionsData as unknown as { ranges: [number, number | null][]; values: number[][] };

/** Every base, in TOD order (a copy). */
export function todWgBases(): TodWgBase[] {
  return [...BASES];
}

/**
 * A base by its sheet id ("58 C4"). Page 64 has "64 A1" in Category 6 and 7:
 * such an id needs the category, or it throws.
 */
export function baseById(id: string, category?: number): TodWgBase | undefined {
  const found = BASES.filter((b) => b.id === id && (category === undefined || b.category === category));
  if (found.length > 1) throw new Error(`Base ${id} is in several categories: pass the category`);
  return found[0];
}

const slug = (s: string) =>
  s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The base's FIG catalog entry id (as scripts/generate-fig-manifest.mjs writes it). */
export function todWgCatalogId(base: TodWgBase): string {
  return `fig-todwg-c${base.category}-${slug(base.id)}`;
}

const BY_CATALOG_ID = new Map(BASES.map((b) => [todWgCatalogId(b), b]));

/** The base behind a FIG catalog entry id, if it's a TOD WG base. */
export function baseForCatalogId(catalogId: string): TodWgBase | undefined {
  return BY_CATALOG_ID.get(catalogId);
}

/** Base group from the base value: 1 = 1-8, 2 = 9-13, 3 = 14-17, 4 = 18 or more. */
export function baseGroup(value: number): BaseGroup {
  if (!Number.isInteger(value) || value < 1) throw new Error(`Not a base value: ${value}`);
  if (value <= 8) return 1;
  if (value <= 13) return 2;
  if (value <= 17) return 3;
  return 4;
}

export type TopSlot = { slot: "top" | "middle"; supports: string[] };

/**
 * The top steps a base needs: none when its drawing already has the top, one
 * for the top, and for Category 2 a second one for the middle acting as a top
 * (both tops' values go in A).
 */
export function topSlots(base: TodWgBase): TopSlot[] {
  if (base.topIncluded) return [];
  const slots: TopSlot[] = [{ slot: "top", supports: [...(base.supports ?? [])] }];
  if (base.category === 2) slots.push({ slot: "middle", supports: [...(base.supportsMiddle ?? [])] });
  return slots;
}

export type SupportOption = {
  table: number;
  page: number;
  support: string;
  /** The table's drawings for this support (Table 8 has two). */
  images: string[];
};

/** Top tables (with the support) that match any of the allowed supports, in table order. */
export function supportOptions(allowed: readonly string[]): SupportOption[] {
  const out: SupportOption[] = [];
  for (const [key, table] of Object.entries(TABLES)) {
    const supports = [...new Set(table.support.map((s) => s.support))];
    for (const support of supports) {
      if (!allowed.includes(support)) continue;
      out.push({
        table: Number(key),
        page: table.page,
        support,
        images: table.support.filter((s) => s.support === support).map((s) => s.image),
      });
    }
  }
  return out.sort((a, b) => a.table - b.table);
}

export type TopPositionOption = {
  /** Position key: wheel letter ("C") or box number ("10"). */
  key: string;
  /** Option letter for a box with several drawings. */
  option?: string;
  /** Sheet id ("54/Tab1 - C"). */
  id: string;
  value: number;
  images: string[];
};

function tableOf(table: number): TopTable | undefined {
  return TABLES[String(table)];
}

function hasSupport(t: TopTable, support: string): boolean {
  return t.support.some((s) => s.support === support);
}

function possibleOn(p: TopPosition, support: string): boolean {
  return !p.notOnSupport?.includes(support);
}

/** Top positions of a table on one of its supports, valued for the base group. */
export function topPositions(table: number, support: string, group: BaseGroup): TopPositionOption[] {
  const t = tableOf(table);
  if (!t || !hasSupport(t, support)) return [];
  const out: TopPositionOption[] = [];
  for (const [key, p] of Object.entries(t.positions)) {
    if (!possibleOn(p, support)) continue;
    if (p.options) {
      for (const o of p.options) {
        const value = o.values[group - 1];
        if (value != null) out.push({ key, option: o.option, id: p.id, value, images: [o.image] });
      }
    } else if (p.values) {
      const value = p.values[group - 1];
      if (value != null) out.push({ key, id: p.id, value, images: (p.images ?? []).map((i) => i.image) });
    }
  }
  return out;
}

export type MotionOption = { key: string; from: string; to: string; id: string; value: number };

/** Motions of a wheel on one support, valued for the base group; both ends must be possible there. */
export function motionOptions(table: number, support: string, group: BaseGroup): MotionOption[] {
  const t = tableOf(table);
  if (!t?.motions || !hasSupport(t, support)) return [];
  const ok = (pos: string) => {
    const p = t.positions[pos];
    return p !== undefined && possibleOn(p, support);
  };
  const out: MotionOption[] = [];
  for (const [key, m] of Object.entries(t.motions)) {
    const [from, to] = key.split("->");
    const value = m.values[group - 1];
    if (ok(from) && ok(to) && value != null) out.push({ key, from, to, id: m.id, value });
  }
  return out;
}

function rangeIndex(value: number): number {
  const i = TRANSITIONS.ranges.findIndex(([lo, hi]) => value >= lo && (hi === null || value <= hi));
  if (i < 0) throw new Error(`Base value ${value} is outside the transitions table`);
  return i;
}

/** Transition value between two pyramids, from the 1st and 2nd bases' values (not base + top). */
export function transitionValue(firstBaseValue: number, secondBaseValue: number): number {
  return TRANSITIONS.values[rangeIndex(firstBaseValue)][rangeIndex(secondBaseValue)];
}
