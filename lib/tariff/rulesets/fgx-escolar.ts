import type { Ruleset } from "./types";

/** FGX ESCOLAR — Parejas, Tríos, Cuartetos (2027 rules). */
export const FGX_ESCOLAR: Ruleset = {
  id: "fgx-escolar",
  catalogId: "FGX",
  levelSystem: "Escolar",
  readyLevelAges: ["Benxamín", "Alevín", "Infantil"],
  blocks: {
    maxElements: 2,
    compulsory: 1,
    optional: 1,
  },
  roleAssignment: "higher-value-compulsory",
  individualSets: 3,
  penalties: {
    missingElement: 0.5,
    missingIndividuals: 1,
  },
  display: {
    hideIndividualValues: true,
  },
};
