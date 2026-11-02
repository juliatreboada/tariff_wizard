import type { Ruleset } from "./types";

/**
 * RFEG Base — Alevín, Infantil, Cadete; Parejas, Tríos, Cuartetos (Código 2026).
 *
 * Compulsory elements come from the sheet's own age-group table, from
 * different rows, and only they add difficulty. Optional elements come from a
 * higher level: for now the older Base age groups' tables (Nacional and FIG
 * tables aren't in the catalog yet, so Cadete has no optional to pick).
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
  optionalFromLevelAges: {
    Alevín: ["Infantil", "Cadete"],
    Infantil: ["Cadete"],
    Cadete: [],
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
