import type { Exercise, LevelSystem } from "../enums";

/** Active element catalog (add more regions later if needed). */
export const CATALOG_IDS = ["FGX"] as const;
export type CatalogId = (typeof CATALOG_IDS)[number];

export const DEFAULT_CATALOG_ID: CatalogId = "FGX";

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
};

export type CatalogManifest = {
  version: 1;
  code: CatalogId;
  description?: string;
  entries: CatalogEntry[];
};
