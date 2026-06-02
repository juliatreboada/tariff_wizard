import {
  CATEGORIES_ESCOLAR_BASE,
  CATEGORIES_FEDERATION,
  CATEGORY_CODES,
  type CategoryCode,
  LEVEL_AGE_BY_SYSTEM,
  type LevelSystem,
} from "./enums";

export function getLevelAgeOptions(system: LevelSystem): readonly string[] {
  return LEVEL_AGE_BY_SYSTEM[system];
}

export function usesEscolarBaseCategories(system: LevelSystem): boolean {
  return system === "Escolar" || system === "Base";
}

export function getCategoryOptions(
  system: LevelSystem,
): readonly string[] {
  return usesEscolarBaseCategories(system)
    ? CATEGORIES_ESCOLAR_BASE
    : CATEGORIES_FEDERATION;
}

/** Number of BASE gymnasts (excluding TOP) for Escolar/Base category labels. */
export function baseCountForCategory(category: string): number {
  switch (category) {
    case "Tríos":
      return 2;
    case "Cuartetos":
      return 3;
    case "Parejas":
    case "Pareja Femenina":
    case "Pareja Masculina":
    case "Pareja Mixta":
      return 1;
    default:
      return 1;
  }
}

export function gymnastCountForCategory(category: string): number {
  return 1 + baseCountForCategory(category);
}

export function normalizeBaseNames(
  names: readonly string[],
  baseCount: number,
): string[] {
  const result = names.map((n) => n.trim());
  while (result.length < baseCount) result.push("");
  return result.slice(0, baseCount);
}

export function getCategoryLabelFromCode(code: CategoryCode): string {
  return CATEGORY_CODES[code];
}

/** Human-readable category for TS sidebar, banner, and lists (never W3/M4 alone). */
export function categoryDisplayLabel(header: {
  category: string;
  categoryCode?: CategoryCode;
}): string {
  const label = header.category.trim();
  if (label) return label;
  if (header.categoryCode) return getCategoryLabelFromCode(header.categoryCode);
  return "";
}

export function findCategoryCodeForLabel(
  label: string,
): CategoryCode | undefined {
  const entry = (
    Object.entries(CATEGORY_CODES) as [CategoryCode, string][]
  ).find(([, value]) => value === label);
  return entry?.[0];
}

/**
 * D-SCORE rule from competition sheet:
 * - DV/100 for: Absoluto Escolar, Junior Base, Senior Base,
 *   Pre-Junior, Junior, Senior, Youth
 * - otherwise: D-SCORE = DV
 */
export function usesDvOver100ForDScore(
  levelSystem: LevelSystem,
  levelAge: string,
): boolean {
  if (levelSystem === "Escolar" && levelAge === "Absoluto") return true;
  if (levelSystem === "Base" && (levelAge === "Junior" || levelAge === "Senior")) {
    return true;
  }
  return (
    levelAge === "Pre-Junior" ||
    levelAge === "Junior" ||
    levelAge === "Senior" ||
    levelAge === "Youth"
  );
}
