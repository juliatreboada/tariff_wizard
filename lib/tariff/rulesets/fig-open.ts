import type { Exercise } from "../enums";
import type { OpenComposition, OpenRequirement, Ruleset, Team } from "./types";

/**
 * Free composition from TOD WG: FIG Youth (12-18), Junior (13-19) and Senior,
 * and the RFEG Pre-Júnior, Júnior and Sénior that follow them (Code of Points
 * 2025-2028, Art. 17–27; Youth & Junior Rules 2025-2028, Sections III–IV;
 * Programa técnico Cto. España 2027). Not offered until TOD WG is in the
 * catalog (`readyLevelAges` empty); requirements that need an element tag stay
 * "próximamente" until TOD WG entries carry it.
 */

const once = { amount: 1, per: "once" } as const;
const each = { amount: 1, per: "each" } as const;

const handstand: OpenRequirement = {
  id: "handstand",
  label: "Pino sin apoyo del ágil",
  match: { tag: "handstand" },
  min: 1,
  penalty: once,
};

/** Code of Points Special Requirements, per routine and team (Art. 19, 20, 23, 26). */
const CODE_REQUIREMENTS: Record<Exercise, Record<Team, readonly OpenRequirement[]>> = {
  Balance: {
    // Art. 19: 5 balance elements valued 1+, an unsupported handstand.
    pairs: [
      { id: "balance-elements", label: "Elementos de equilibrio (valor 1+)", match: { family: "balance", minValue: 1 }, min: 5, penalty: each },
      handstand,
    ],
    // Art. 20: 2 separate pyramids of different categories, 3 static holds, a handstand by the top.
    groups: [
      { id: "pyramids", label: "Pirámides de categorías distintas", match: { tag: "pyramid" }, min: 2, distinctPyramidCategories: true, penalty: each },
      { id: "static-holds", label: "Estáticos (3\")", match: { tag: "static-hold" }, min: 3, penalty: each },
      handstand,
    ],
  },
  Dynamic: {
    // Art. 23: 6 elements with flight valued 1+, 2 catches.
    pairs: [
      { id: "flights", label: "Elementos con vuelo (valor 1+)", match: { tag: "flight", minValue: 1 }, min: 6, penalty: each },
      { id: "catches", label: "Recepciones en agarre (catches)", match: { tag: "catch" }, min: 2, penalty: each },
    ],
    groups: [
      { id: "flights", label: "Elementos con vuelo (valor 1+)", match: { tag: "flight", minValue: 1 }, min: 6, penalty: each },
      { id: "catches", label: "Recepciones en agarre (catches)", match: { tag: "catch" }, min: 2, penalty: each },
    ],
  },
  Combined: {
    // Art. 26: 3 static holds and 3 dynamic elements valued 1+, a catch, a handstand.
    pairs: [
      { id: "static-holds", label: "Estáticos (valor 1+)", match: { tag: "static-hold", minValue: 1 }, min: 3, penalty: each },
      { id: "dynamic-elements", label: "Elementos dinámicos (valor 1+)", match: { family: "dynamic", minValue: 1 }, min: 3, penalty: each },
      { id: "catch", label: "Recepción en agarre (catch)", match: { tag: "catch" }, min: 1, penalty: once },
      handstand,
    ],
    groups: [
      { id: "static-holds", label: "Estáticos (valor 1+)", match: { tag: "static-hold", minValue: 1 }, min: 3, penalty: each },
      { id: "dynamic-elements", label: "Elementos dinámicos (valor 1+)", match: { family: "dynamic", minValue: 1 }, min: 3, penalty: each },
      { id: "catch", label: "Recepción en agarre (catch)", match: { tag: "catch" }, min: 1, penalty: once },
      handstand,
    ],
  },
};

/**
 * RFEG Júnior and Sénior, Dynamic and Combined: at least 1 element with 4/4
 * transverse rotation (salto), at most 3 floor landings with 0/4 rotation;
 * 1 point each time one isn't met.
 */
const RFEG_EXTRAS: readonly OpenRequirement[] = [
  { id: "rfeg-salto", label: "Un elemento con 4/4 de rotación (mortal)", match: { family: "dynamic", minRotation: 4 }, min: 1, penalty: once },
  { id: "rfeg-landings", label: "Recepciones a suelo con 0/4 de rotación", match: { tag: "landing", maxRotation: 0 }, max: 3, penalty: once },
];

function withRfegExtras(): OpenComposition["requirements"] {
  const add = (reqs: readonly OpenRequirement[]) => [...reqs, ...RFEG_EXTRAS];
  return {
    Balance: CODE_REQUIREMENTS.Balance,
    Dynamic: { pairs: add(CODE_REQUIREMENTS.Dynamic.pairs), groups: add(CODE_REQUIREMENTS.Dynamic.groups) },
    Combined: { pairs: add(CODE_REQUIREMENTS.Combined.pairs), groups: add(CODE_REQUIREMENTS.Combined.groups) },
  };
}

const todWg = { catalogId: "FIG", levelSystem: "FIG", levelAge: "TOD WG", label: "TOD WG" } as const;

/** Youth & Junior Rules 5.2 / 8.2: difficulty strictly limited; up to 20 values over without penalty (5.3 / 8.3). */
const YOUTH_LIMIT = { Balance: 90, Dynamic: 80, Combined: 110 } as const;
const JUNIOR_LIMIT = { Balance: 120, Dynamic: 110, Combined: 180 } as const;

/** Programa técnico Cto. España 2027: "Dificultad mínima Júnior y Sénior". */
const RFEG_SENIOR_MIN = {
  Balance: { pairs: 50, groups: 60 },
  Dynamic: { pairs: 45, groups: 55 },
  Combined: { pairs: 80, groups: 90 },
} as const;
const RFEG_JUNIOR_MIN = {
  Balance: { pairs: 35, groups: 45 },
  Dynamic: { pairs: 30, groups: 40 },
  Combined: { pairs: 40, groups: 50 },
} as const;

function openRuleset(
  base: Pick<Ruleset, "id" | "label" | "levelSystem" | "levelAges">,
  open: Partial<OpenComposition>,
): Ruleset {
  return {
    ...base,
    catalogId: "FIG",
    readyLevelAges: [],
    exercises: ["Balance", "Dynamic", "Combined"],
    // Every pair/group element is "compulsory" (adds difficulty); `maxElements` limits the routine.
    blocks: {
      balance: { pairs: { compulsory: 8, optional: 0 }, groups: { compulsory: 8, optional: 0 } },
      dynamic: { pairs: { compulsory: 8, optional: 0 }, groups: { compulsory: 8, optional: 0 } },
    },
    roleAssignment: "by-table",
    compulsoryFromDifferentRows: false,
    optionalTables: {},
    optionalNotInCompulsoryRow: false,
    open: {
      source: todWg,
      maxElements: 8,
      requirements: CODE_REQUIREMENTS,
      individualsAddDifficulty: true,
      combinedWeighting: true,
      ...open,
    },
    // Up to 3 per gymnast (CoP 17.9), not required.
    individuals: { sets: 3, available: true, source: { catalogId: "FIG", levelSystem: "FIG" } },
    penalties: { missingElement: 1, missingIndividuals: 0 },
    display: { hideIndividualValues: false },
  };
}

const limited = (difficultyLimit: OpenComposition["difficultyLimit"]) => ({
  difficultyLimit,
  overLimitTolerance: 20,
  overLimitPenalty: 1,
});

export const FIG_YOUTH = openRuleset({ id: "fig-youth", label: "Youth 12-18", levelSystem: "FIG", levelAges: ["Youth"] }, limited(YOUTH_LIMIT));
export const FIG_JUNIOR = openRuleset({ id: "fig-junior", label: "Junior 13-19", levelSystem: "FIG", levelAges: ["Junior"] }, limited(JUNIOR_LIMIT));
export const FIG_SENIOR = openRuleset({ id: "fig-senior", label: "Senior", levelSystem: "FIG", levelAges: ["Senior"] }, {});

/**
 * RFEG Pre-Júnior and Júnior follow FIG Youth 12-18 and Junior 13-19 (coach,
 * 2026-11-13), but RFEG has no difficulty limit: every element adds to DV.
 */
export const RFEG_PRE_JUNIOR = openRuleset(
  { id: "rfeg-pre-junior", label: "Pre-Júnior", levelSystem: "RFEG", levelAges: ["Pre-Junior"] },
  {},
);
export const RFEG_JUNIOR = openRuleset(
  { id: "rfeg-junior", label: "Júnior", levelSystem: "RFEG", levelAges: ["Junior"] },
  { minDifficulty: RFEG_JUNIOR_MIN, minDifficultyPenalty: 1, requirements: withRfegExtras() },
);
export const RFEG_SENIOR = openRuleset(
  { id: "rfeg-senior", label: "Sénior", levelSystem: "RFEG", levelAges: ["Senior"] },
  { minDifficulty: RFEG_SENIOR_MIN, minDifficultyPenalty: 1, requirements: withRfegExtras() },
);
