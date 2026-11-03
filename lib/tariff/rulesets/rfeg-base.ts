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

/** FIG Pre-Youth (11-16) tables: pairs split like España; Tríos / Cuartetos = Women's / Men's Group. */
const ageGroup1116: TableRef = {
  catalogId: "FIG",
  levelSystem: "FIG",
  levelAge: "Pre-Youth",
  label: "11-16",
  categories: { Parejas: ["Pareja Femenina", "Pareja Masculina", "Pareja Mixta"] },
};

/**
 * RFEG Base — Alevín, Infantil, Cadete; Parejas, Tríos, Cuartetos (Código 2026).
 *
 * Compulsory elements come from the sheet's own age-group table, from
 * different rows, and only they add difficulty. Optional elements come from a
 * higher level — Alevín: Base Infantil, Cto. España Alevín; Infantil: Base
 * Cadete, Cto. España Infantil; Cadete: Age Group 11-16 (TOD WG isn't in the
 * catalog yet) — and never from a row holding the same element as a compulsory.
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
  // RFEG Programa técnico Campeonato Nacional Base (2027), Anexo tabla 1.
  // TOD Alevín / Infantil = the Cto. España tables. TOD WG isn't in the catalog yet.
  optionalTables: {
    Alevín: [base("Infantil"), espana("Alevín")],
    Infantil: [base("Cadete"), espana("Infantil")],
    Cadete: [ageGroup1116],
  },
  optionalNotInCompulsoryRow: true,
  optionalValueRanges: RFEG_BASE_OPTIONAL_VALUE_RANGES,
  // Cadete: "Los giros horizontales de 360º/540º/720º NO pueden utilizarse como
  // elementos opcionales" (Women's Group dynamic ROW I Box 4).
  notOptional: {
    Cadete: ["fig-pre-youth-trios-dynamic-row-i-4-360", "fig-pre-youth-trios-dynamic-row-i-4-540"],
  },
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
