import type { Exercise, LevelSystem } from "../enums";

/** Element catalogs: FGX (ESCOLAR), RFEG (Base, Cto. España) and FIG (Pre-Youth 11-16). */
export const CATALOG_IDS = ["FGX", "RFEG", "FIG"] as const;
export type CatalogId = (typeof CATALOG_IDS)[number];

export const DEFAULT_CATALOG_ID: CatalogId = "FGX";

export function isCatalogId(value: unknown): value is CatalogId {
  return (CATALOG_IDS as readonly unknown[]).includes(value);
}

/** Catalog section: equilibrio grid, dinámico grid, or individual figures. */
export const ELEMENT_FAMILIES = ["balance", "dynamic", "individual"] as const;
export type ElementFamily = (typeof ELEMENT_FAMILIES)[number];

/** Element table type (EQ, FLEX, AG, TUM) — not used on dynamic for now. */
export const ELEMENT_TYPES = ["EQ", "FLEX", "AG", "TUM"] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

export type CatalogFilters = {
  levelSystems: LevelSystem[];
  categories: string[];
  exercises: Exercise[];
  /** Age groups (header `levelAge`); omitted = every age of the level system. */
  levelAges?: string[];
};

export type CatalogEntry = {
  id: string;
  /** Catalog set identifier (e.g. FGX). */
  code: CatalogId;
  elementFamily: ElementFamily;
  /** EQ / FLEX / AG / TUM (balance + individual; dynamic omits for now). */
  type?: ElementType;
  /** Table coordinates (e.g. ROW-I A, FLEX 3) — SH row and UI. */
  coordinates: string;
  /** Path relative to `public/catalog/<code>/` */
  image: string;
  value: number;
  /** Balance static hold time for meta row (e.g. 3"). */
  holdDuration?: string;
  /** Dynamic rotation for meta row (e.g. 1/4 BACK). */
  rotation?: string;
  filters: CatalogFilters;
  /**
   * An add-on, not an element of its own: it attaches to one of these entries
   * (e.g. Cuartetos ROW III on a ROW I pyramid) and adds its value.
   */
  attachesTo?: string[];
  /** The same element in other tables (e.g. an older age group's), for row rules. */
  sameAs?: string[];
};

export type CatalogManifest = {
  version: 1;
  code: CatalogId;
  description?: string;
  entries: CatalogEntry[];
};
