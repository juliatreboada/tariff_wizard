import type { Exercise, LevelSystem } from "../enums";

/** Active element catalog (add more regions later if needed). */
export const CATALOG_IDS = ["FGX"] as const;
export type CatalogId = (typeof CATALOG_IDS)[number];

export const DEFAULT_CATALOG_ID: CatalogId = "FGX";

/** Balance element subtypes (picker step 1). */
export const BALANCE_SUBTYPES = ["mount", "static", "motion"] as const;
export type BalanceSubtype = (typeof BALANCE_SUBTYPES)[number];

export type CatalogFilters = {
  levelSystems: LevelSystem[];
  categories: string[];
  exercises: Exercise[];
};

export type CatalogEntry = {
  id: string;
  region: CatalogId;
  elementFamily: "balance";
  subtype: BalanceSubtype;
  label: string;
  /** Path relative to `public/catalog/<region>/` */
  image: string;
  /** Reference shown on SH row (Galician / table code). */
  galicianCode: string;
  value: number;
  /** Balance static: hold time for meta row (e.g. 3"). */
  holdDuration?: string;
  /** Dynamic: rotation label for meta row (e.g. 1/4 BACK). */
  dynamicNotation?: string;
  filters: CatalogFilters;
};

export type CatalogManifest = {
  version: 1;
  region: CatalogId;
  description?: string;
  entries: CatalogEntry[];
};
