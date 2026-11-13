import { usesDvOver100ForDScore } from "../level-category";
import type { RoutineItem } from "../routine-types";
import type { StoredHeader, ValueBreakdown } from "../types";
import { rulesetFor } from "./index";
import { openDifficulty } from "./open";

/**
 * What the sheet's sidebar shows: the value breakdown and D-SCORE.
 * Free composition (Youth, Junior, Senior): every pair/group element plus the
 * averaged individuals, up to the routine's limit, DV / 100. Otherwise the
 * stored breakdown (compulsory elements), DV or DV / 100 by level, capped by
 * the ruleset (Pre-Youth: 0.5).
 */
export function sheetDifficulty(
  header: StoredHeader,
  routine: RoutineItem[],
  stored: ValueBreakdown,
): { breakdown: ValueBreakdown; dScore: number } {
  const ruleset = rulesetFor(header);
  if (ruleset?.open) {
    const d = openDifficulty(ruleset, header, routine);
    return {
      breakdown: { balance: d.balance, dynamic: d.dynamic, individual: d.individual, total: d.total },
      dScore: d.dScore,
    };
  }
  const dv = stored.total;
  const uncapped = usesDvOver100ForDScore(header.levelSystem, header.levelAge) ? dv / 100 : dv;
  const cap = ruleset?.difficultyCap;
  return { breakdown: stored, dScore: cap === undefined ? uncapped : Math.min(uncapped, cap) };
}
