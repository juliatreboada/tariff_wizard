import { gymnastCountForCategory } from "../level-category";
import { countCompleteIndividualSets } from "../routine-groups";
import type { RoutineItem } from "../routine-types";
import type { StoredHeader } from "../types";
import type { Ruleset } from "./types";

type RequirementStatus = {
  expected: number;
  actual: number;
};

export type RuleStatus = {
  enabled: boolean;
  compulsoryBalance: RequirementStatus;
  compulsoryDynamic: RequirementStatus;
  optionalBalance: RequirementStatus;
  optionalDynamic: RequirementStatus;
  individualPerGymnast: RequirementStatus;
  missingCompulsoryBalance: boolean;
  missingCompulsoryDynamic: boolean;
  missingOptionalBalance: boolean;
  missingOptionalDynamic: boolean;
  missingIndividuals: boolean;
  penaltyTotal: number;
  missingMessages: string[];
};

function status(expected: number, actual: number): RequirementStatus {
  return { expected, actual };
}

const disabled = (): RuleStatus => ({
  enabled: false,
  compulsoryBalance: status(0, 0),
  compulsoryDynamic: status(0, 0),
  optionalBalance: status(0, 0),
  optionalDynamic: status(0, 0),
  individualPerGymnast: status(0, 0),
  missingCompulsoryBalance: false,
  missingCompulsoryDynamic: false,
  missingOptionalBalance: false,
  missingOptionalDynamic: false,
  missingIndividuals: false,
  penaltyTotal: 0,
  missingMessages: [],
});

export function evaluateRules(
  ruleset: Ruleset | null,
  header: StoredHeader | null,
  routine: RoutineItem[],
): RuleStatus {
  if (!ruleset) return disabled();

  const count = (role: "compulsory" | "optional", block: "balance" | "dynamic") =>
    routine.filter((item) => item.role === role && item.block === block).length;

  const { compulsory, optional } = ruleset.blocks;
  const compulsoryBalance = status(compulsory, count("compulsory", "balance"));
  const compulsoryDynamic = status(compulsory, count("compulsory", "dynamic"));
  const optionalBalance = status(optional, count("optional", "balance"));
  const optionalDynamic = status(optional, count("optional", "dynamic"));

  const gymnastCount = header ? gymnastCountForCategory(header.category) : 2;
  const { complete } = countCompleteIndividualSets(routine, gymnastCount);
  const individualPerGymnast = status(ruleset.individualSets, complete);

  const shortBy = (s: RequirementStatus) => Math.max(0, s.expected - s.actual);
  const missingCompulsoryBalance = shortBy(compulsoryBalance) > 0;
  const missingCompulsoryDynamic = shortBy(compulsoryDynamic) > 0;
  const missingOptionalBalance = shortBy(optionalBalance) > 0;
  const missingOptionalDynamic = shortBy(optionalDynamic) > 0;
  const missingIndividuals = shortBy(individualPerGymnast) > 0;

  const missingMessages: string[] = [];
  if (missingCompulsoryBalance) {
    missingMessages.push(`Falta ${shortBy(compulsoryBalance)} obligatorio de equilibrio.`);
  }
  if (missingCompulsoryDynamic) {
    missingMessages.push(`Falta ${shortBy(compulsoryDynamic)} obligatorio de dinámico.`);
  }
  if (missingOptionalBalance) {
    missingMessages.push(`Falta ${shortBy(optionalBalance)} opcional de equilibrio.`);
  }
  if (missingOptionalDynamic) {
    missingMessages.push(`Falta ${shortBy(optionalDynamic)} opcional de dinámico.`);
  }
  if (missingIndividuals) {
    missingMessages.push(
      `Faltan sets individuales (${complete}/${ruleset.individualSets} completos).`,
    );
  }

  const missingElements =
    shortBy(compulsoryBalance) +
    shortBy(compulsoryDynamic) +
    shortBy(optionalBalance) +
    shortBy(optionalDynamic);
  const penaltyTotal =
    missingElements * ruleset.penalties.missingElement +
    (missingIndividuals ? ruleset.penalties.missingIndividuals : 0);

  return {
    enabled: true,
    compulsoryBalance,
    compulsoryDynamic,
    optionalBalance,
    optionalDynamic,
    individualPerGymnast,
    missingCompulsoryBalance,
    missingCompulsoryDynamic,
    missingOptionalBalance,
    missingOptionalDynamic,
    missingIndividuals,
    penaltyTotal,
    missingMessages,
  };
}
