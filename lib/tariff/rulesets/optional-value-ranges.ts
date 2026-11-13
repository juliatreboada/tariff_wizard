import type { TeamBlockRanges } from "./types";

const ranges = (
  pairs: [balance: [number, number], dynamic: [number, number]],
  groups: [balance: [number, number], dynamic: [number, number]],
): TeamBlockRanges => {
  const block = ([[bMin, bMax], [dMin, dMax]]: typeof pairs) => ({
    balance: { min: bMin, max: bMax },
    dynamic: { min: dMin, max: dMax },
  });
  return { pairs: block(pairs), groups: block(groups) };
};

/**
 * Optional element values, Programa técnico Campeonato Nacional Base y Clubes
 * (2027; the same as 2026). Cadete pairs balance: the requirement text says
 * 1–6 held 3", the summary table 1–8; the text wins.
 */
export const RFEG_BASE_OPTIONAL_VALUE_RANGES: Readonly<Record<string, TeamBlockRanges>> = {
  Alevín: ranges([[0, 4], [0, 4]], [[0, 6], [0, 4]]),
  Infantil: ranges([[0, 6], [0, 6]], [[0, 10], [0, 6]]),
  Cadete: ranges([[1, 6], [1, 8]], [[1, 12], [1, 8]]),
};

/**
 * Optional element values, Programa técnico Campeonato de España y Clubes 2027
 * (wider than 2026: Alevín pairs 1–6 / 1–6 → 1–8 / 1–12, …). Used by the
 * Cto. España ruleset (`rfeg-espana.ts`).
 */
export const RFEG_ESPANA_OPTIONAL_VALUE_RANGES: Readonly<Record<string, TeamBlockRanges>> = {
  Alevín: ranges([[1, 8], [1, 12]], [[1, 12], [1, 12]]),
  Infantil: ranges([[1, 8], [1, 12]], [[1, 12], [1, 12]]),
  Cadete: ranges([[1, 9], [1, 14]], [[1, 16], [1, 14]]),
};
