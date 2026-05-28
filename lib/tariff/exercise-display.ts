import type { Messages } from "@/lib/i18n/messages/es";
import type { Exercise, LevelSystem } from "./enums";
import { usesDvOver100ForDScore } from "./level-category";

/** When true, sidebar shows D-SCORE = DV (combined routine scoring). */
export function dvEqualsDScore(
  levelSystem: LevelSystem,
  levelAge: string,
): boolean {
  return !usesDvOver100ForDScore(levelSystem, levelAge);
}

export function isCombinedRoutineLevel(
  levelSystem: LevelSystem,
  levelAge: string,
): boolean {
  return dvEqualsDScore(levelSystem, levelAge);
}

export function exerciseLabel(
  exercise: Exercise,
  exercises: Messages["exercises"],
): string {
  switch (exercise) {
    case "Balance":
      return exercises.balance;
    case "Dynamic":
      return exercises.dynamic;
    case "Combined":
      return exercises.combined;
  }
}

export function exerciseOptionsForLevel(
  levelSystem: LevelSystem,
  levelAge: string,
): readonly Exercise[] {
  if (isCombinedRoutineLevel(levelSystem, levelAge)) {
    return ["Combined"];
  }
  return ["Balance", "Dynamic", "Combined"];
}
