import { RFEG_BASE_OPTIONAL_VALUE_RANGES } from "./optional-value-ranges";
import type { Ruleset, TableRef } from "./types";

const base = (levelAge: string): TableRef => ({
  catalogId: "RFEG",
  levelSystem: "Base",
  levelAge,
  label: "BASE",
});

/** Campeonato de España tables: pairs are split into femenina, masculina, mixta. */
const espana = (levelAge: string): TableRef => ({
  catalogId: "RFEG",
  levelSystem: "RFEG",
  levelAge,
  label: "Cto. España",
  categories: { Parejas: ["Pareja Femenina", "Pareja Masculina", "Pareja Mixta"] },
});

/**
 * RFEG Base — Alevín, Infantil, Cadete; Parejas, Tríos, Cuartetos (Código 2026).
 *
 * Compulsory elements come from the sheet's own age-group table, from
 * different rows, and only they add difficulty. Optional elements come from a
 * higher level: Alevín from Base Infantil, Infantil from Base Cadete (their
 * TOD Alevín / Infantil / 11-16 / FIG options aren't in the catalog yet, so
 * Cadete has no optional to pick), and never from a row holding the same
 * element as a compulsory.
 */
export const RFEG_BASE: Ruleset = {
  id: "rfeg-base",
  label: "BASE",
  catalogId: "RFEG",
  levelSystem: "Base",
  readyLevelAges: ["Alevín", "Infantil", "Cadete"],
  blocks: {
    balance: {
      pairs: { compulsory: 2, optional: 1 },
      groups: { compulsory: 1, optional: 1 },
    },
    dynamic: {
      pairs: { compulsory: 2, optional: 1 },
      groups: { compulsory: 2, optional: 1 },
    },
  },
  roleAssignment: "by-table",
  compulsoryFromDifferentRows: true,
  // RFEG Programa técnico Campeonato Nacional Base (aprobado 26-09-2025), Anexo tabla 1.
  // TOD Alevín / Infantil = the Cto. España tables. Not in the catalog yet: TOD Age
  // Group 11-16 and TOD FIG, so Cadete has no optional to pick.
  optionalTables: {
    Alevín: [base("Infantil"), espana("Alevín")],
    Infantil: [base("Cadete"), espana("Infantil")],
    Cadete: [],
  },
  optionalNotInCompulsoryRow: true,
  optionalValueRanges: RFEG_BASE_OPTIONAL_VALUE_RANGES,
  // 3 sets, at least one tumbling; difficulty not added. Pictures are FIG's: coming soon.
  individuals: { sets: 3, available: false },
  penalties: {
    missingElement: 1,
    missingIndividuals: 1,
  },
  display: {
    hideIndividualValues: true,
  },
};
