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

export function getCategoryLabelFromCode(code: CategoryCode): string {
  return CATEGORY_CODES[code];
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
