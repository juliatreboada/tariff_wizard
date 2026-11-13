import type { Ruleset, TableRef, TeamBlockRanges } from "./types";

/** FIG Pre-Youth (11-16) compulsory tables; Tríos / Cuartetos = Women's / Men's Group. */
const ageGroup1116: TableRef = {
  catalogId: "FIG",
  levelSystem: "FIG",
  levelAge: "Pre-Youth",
  label: "Age Group 11-16",
};

/**
 * Optionals from TOD WG, in its values (Youth & Junior Rules, Appendix 3, Art. 2.4):
 * pairs balance 1–9, dynamic 1–14; groups balance 4–16, dynamic 1–14 (Men's
 * Group 1–10).
 */
const optionalRanges: TeamBlockRanges = {
  pairs: { balance: { min: 1, max: 9 }, dynamic: { min: 1, max: 14 } },
  groups: { balance: { min: 4, max: 16 }, dynamic: { min: 1, max: 14 } },
  categories: { Cuartetos: { dynamic: { min: 1, max: 10 } } },
};

/**
 * Pre-Youth (11-16) rules (ACRO Youth & Junior Rules 2025-2028, Appendix 3):
 * one Balance and one Dynamic routine, each with compulsory elements from the
 * 11-16 table, one per row, and optionals from TOD WG (not the 11-16 table;
 * Appendix 4 optional elements left out for now, coach 2026-11-13). TOD WG
 * isn't in the catalog yet, so optionals are "próximamente". Only compulsory
 * elements add difficulty.
 */
function preYouth(base: Pick<Ruleset, "id" | "label" | "catalogId" | "levelSystem" | "levelAges" | "readyLevelAges">): Ruleset {
  const age = base.readyLevelAges[0]!;
  return {
    ...base,
    exercises: ["Balance", "Dynamic"],
    blocks: {
      // Pairs: 4 compulsory (rows I–IV) + 2 optional; groups: 2 pyramids + 1 optional.
      balance: {
        pairs: { compulsory: 4, optional: 2 },
        groups: { compulsory: 2, optional: 1 },
      },
      // Pairs and groups: 4 compulsory (rows I–IV) + 2 optional.
      dynamic: {
        pairs: { compulsory: 4, optional: 2 },
        groups: { compulsory: 4, optional: 2 },
      },
    },
    roleAssignment: "by-table",
    compulsoryFromDifferentRows: true,
    optionalTables: {},
    optionalNotInCompulsoryRow: false,
    optionalValueRanges: { [age]: optionalRanges },
    // 3 per gymnast in each routine: Balance from the flexibility, balance and
    // agility tables, Dynamic from tumbling; FIG ToD elements up to 10.
    individuals: {
      sets: 3,
      available: true,
      source: { catalogId: "FIG", levelSystem: "FIG" },
      valueRange: { [age]: { min: 1, max: 10 } },
      typesByExercise: { Balance: ["EQ", "FLEX", "AG"], Dynamic: ["TUM"] },
    },
    penalties: {
      missingElement: 1,
      missingIndividuals: 1,
    },
    display: {
      hideIndividualValues: true,
    },
  };
}

/** FIG Pre-Youth (11-16): D-SCORE up to 0.5 (Art. 7.5). */
export const FIG_PRE_YOUTH: Ruleset = {
  ...preYouth({
    id: "fig-pre-youth",
    label: "11-16",
    catalogId: "FIG",
    levelSystem: "FIG",
    levelAges: ["Pre-Youth"],
    readyLevelAges: ["Pre-Youth"],
  }),
  difficultyCap: 0.5,
};

/**
 * RFEG Juvenil: "se regirá por el Código de Puntuación del Grupo de Edad 11-16
 * … excepto el límite de dificultad" (Programa técnico Cto. España 2027): the
 * Pre-Youth rules with no D-SCORE cap.
 */
export const RFEG_JUVENIL: Ruleset = {
  ...preYouth({
    id: "rfeg-juvenil",
    label: "Juvenil",
    catalogId: "RFEG",
    levelSystem: "RFEG",
    levelAges: ["Juvenil"],
    readyLevelAges: ["Juvenil"],
  }),
  compulsoryTables: { Juvenil: ageGroup1116 },
};
