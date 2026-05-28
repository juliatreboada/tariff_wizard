import type { CategoryCode, Exercise, LevelSystem } from "./enums";

/** Header data persisted in the wizard store (pair v1: one base). */
export type StoredHeader = {
  country?: string;
  clubName: string;
  participationNumber?: string;
  competition: string;
  levelSystem: LevelSystem;
  levelAge: string;
  category: string;
  categoryCode?: CategoryCode;
  exercise: Exercise;
  topName: string;
  baseNames: [string];
  contactName: string;
  contactPhone: string;
};

/** Totals under VALUE on the right column (calculated later from elements). */
export type ValueBreakdown = {
  total: number;
  balance: number;
  dynamic: number;
  individual: number;
};
