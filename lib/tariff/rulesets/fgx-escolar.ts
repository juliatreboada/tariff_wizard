import type { Ruleset } from "./types";

const ONE_AND_ONE = { compulsory: 1, optional: 1 };

/** FGX ESCOLAR — Parejas, Tríos, Cuartetos (2027 rules). */
export const FGX_ESCOLAR: Ruleset = {
  id: "fgx-escolar",
  label: "ESCOLAR",
  catalogId: "FGX",
  levelSystem: "Escolar",
  readyLevelAges: ["Prebenxamín", "Benxamín", "Alevín", "Infantil"],
  blocks: {
    balance: { pairs: ONE_AND_ONE, groups: ONE_AND_ONE },
    dynamic: { pairs: ONE_AND_ONE, groups: ONE_AND_ONE },
  },
  roleAssignment: "higher-value-compulsory",
  compulsoryFromDifferentRows: false,
  // A higher level: any RFEG Base age group.
  optionalTables: {
    "*": ["Alevín", "Infantil", "Cadete"].map((levelAge) => ({
      catalogId: "RFEG" as const,
      levelSystem: "Base" as const,
      levelAge,
      label: "BASE",
    })),
  },
  optionalNotInCompulsoryRow: false,
  individuals: { sets: 3, available: true },
  penalties: {
    missingElement: 0.5,
    missingIndividuals: 1,
  },
  display: {
    hideIndividualValues: true,
  },
};
