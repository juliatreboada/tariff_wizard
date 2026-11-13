import { RFEG_ESPANA_OPTIONAL_VALUE_RANGES } from "./optional-value-ranges";
import type { Ruleset, TableRef } from "./types";

/** Campeonato de España tables (catalog RFEG, level RFEG): one per pair category, Tríos, Cuartetos. */
const espana = (levelAge: string): TableRef => ({
  catalogId: "RFEG",
  levelSystem: "RFEG",
  levelAge,
  label: "Cto. España",
});

/** FIG Pre-Youth (11-16) tables; Tríos / Cuartetos = Women's / Men's Group. */
const ageGroup1116: TableRef = {
  catalogId: "FIG",
  levelSystem: "FIG",
  levelAge: "Pre-Youth",
  label: "Age Group 11-16",
};

/**
 * RFEG Campeonato de España — Alevín, Infantil, Cadete (Programa técnico 2027).
 *
 * Compulsory elements come from the age group's table (Alevín, Infantil: the
 * Cto. España tables; Cadete: Age Group 11-16), from different rows, and only
 * they add difficulty. Optionals: Alevín from TOD Infantil (and TOD WG),
 * Infantil from Age Group 11-16 (and TOD WG), Cadete from TOD WG or another
 * row of its own 11-16 table (coach, 2026-11-13). TOD WG isn't in the catalog
 * yet. Juvenil follows the full 11-16 code (balance + dynamic): not here.
 */
export const RFEG_ESPANA: Ruleset = {
  id: "rfeg-espana",
  label: "Cto. España",
  catalogId: "RFEG",
  levelSystem: "RFEG",
  levelAges: ["Alevín", "Infantil", "Cadete"],
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
  compulsoryTables: { Cadete: ageGroup1116 },
  // Cadete: "no podrán encontrarse en las mismas filas que los elementos
  // obligatorios … pero sí en filas diferentes de la misma tabla".
  optionalFromOwnTable: ["Cadete"],
  compulsoryFromDifferentRows: true,
  // The Alevín text wins over the summary table ("Alevín e Infantil": 11-16).
  optionalTables: {
    Alevín: [espana("Infantil")],
    Infantil: [ageGroup1116],
    Cadete: [],
  },
  optionalNotInCompulsoryRow: true,
  optionalValueRanges: RFEG_ESPANA_OPTIONAL_VALUE_RANGES,
  // Cadete: "Los giros horizontales de 360º/540º/720º NO pueden utilizarse como
  // elementos opcionales" (11-16 Women's Group dynamic ROW I Box 4).
  notOptional: {
    Cadete: ["fig-pre-youth-trios-dynamic-row-i-4"],
  },
  // 3 sets from TOD 11-16 or TOD WG (today: the FIG Table of Difficulty), at
  // least one tumbling per gymnast; no element above 10; difficulty not added.
  individuals: {
    sets: 3,
    available: true,
    source: { catalogId: "FIG", levelSystem: "FIG" },
    valueRange: {
      Alevín: { min: 1, max: 10 },
      Infantil: { min: 1, max: 10 },
      Cadete: { min: 1, max: 10 },
    },
    requireTumbling: true,
  },
  penalties: {
    missingElement: 1,
    missingIndividuals: 1,
    missingTumbling: 1,
  },
  display: {
    hideIndividualValues: true,
  },
};
