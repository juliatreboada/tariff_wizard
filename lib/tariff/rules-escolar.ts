import { gymnastCountForCategory } from "./level-category";
import { countCompleteIndividualSets } from "./routine-groups";
import type { RoutineItem } from "./routine-types";
import type { StoredHeader } from "./types";

const EXPECTED_INDIVIDUAL_SETS = 3;
const MISSING_ELEMENT_PENALTY = 0.5;
/** One flat penalty if any individual set is missing, regardless of how many. */
const MISSING_INDIVIDUALS_PENALTY = 1;

type RequirementStatus = {
  expected: number;
  actual: number;
};

export type EscolarRuleStatus = {
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

export function isEscolarRuleset(header: StoredHeader | null): boolean {
  return header?.levelSystem === "Escolar";
}

export function evaluateEscolarRules(
  header: StoredHeader | null,
  routine: RoutineItem[],
): EscolarRuleStatus {
  if (!isEscolarRuleset(header)) {
    return {
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
    };
  }

  const compulsoryBalance = routine.filter(
    (item) => item.role === "compulsory" && item.block === "balance",
  ).length;
  const compulsoryDynamic = routine.filter(
    (item) => item.role === "compulsory" && item.block === "dynamic",
  ).length;
  const optionalBalance = routine.filter(
    (item) => item.role === "optional" && item.block === "balance",
  ).length;
  const optionalDynamic = routine.filter(
    (item) => item.role === "optional" && item.block === "dynamic",
  ).length;

  const gymnastCount = header
    ? gymnastCountForCategory(header.category)
    : 2;
  const { complete: completeIndividualSets } = countCompleteIndividualSets(
    routine,
    gymnastCount,
  );
  const expectedIndividuals = EXPECTED_INDIVIDUAL_SETS;
  const actualIndividuals = completeIndividualSets;

  const missingCompulsoryBalance = compulsoryBalance < 1;
  const missingCompulsoryDynamic = compulsoryDynamic < 1;
  const missingOptionalBalance = optionalBalance < 1;
  const missingOptionalDynamic = optionalDynamic < 1;
  const missingIndividuals = actualIndividuals < expectedIndividuals;

  const missingMessages: string[] = [];
  if (missingCompulsoryBalance) {
    missingMessages.push("Falta 1 obligatorio de equilibrio.");
  }
  if (missingCompulsoryDynamic) {
    missingMessages.push("Falta 1 obligatorio de dinámico.");
  }
  if (missingOptionalBalance) {
    missingMessages.push("Falta 1 opcional de equilibrio.");
  }
  if (missingOptionalDynamic) {
    missingMessages.push("Falta 1 opcional de dinámico.");
  }
  if (missingIndividuals) {
    missingMessages.push(
      `Faltan sets individuales (${actualIndividuals}/${expectedIndividuals} completos).`,
    );
  }
  const penaltyTotal =
    (missingCompulsoryBalance ? MISSING_ELEMENT_PENALTY : 0) +
    (missingCompulsoryDynamic ? MISSING_ELEMENT_PENALTY : 0) +
    (missingOptionalBalance ? MISSING_ELEMENT_PENALTY : 0) +
    (missingOptionalDynamic ? MISSING_ELEMENT_PENALTY : 0) +
    (missingIndividuals ? MISSING_INDIVIDUALS_PENALTY : 0);

  return {
    enabled: true,
    compulsoryBalance: status(1, compulsoryBalance),
    compulsoryDynamic: status(1, compulsoryDynamic),
    optionalBalance: status(1, optionalBalance),
    optionalDynamic: status(1, optionalDynamic),
    individualPerGymnast: status(expectedIndividuals, actualIndividuals),
    missingCompulsoryBalance,
    missingCompulsoryDynamic,
    missingOptionalBalance,
    missingOptionalDynamic,
    missingIndividuals,
    penaltyTotal,
    missingMessages,
  };
}
