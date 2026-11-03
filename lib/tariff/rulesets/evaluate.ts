import { gymnastCountForCategory } from "../level-category";
import { countCompleteIndividualSets } from "../routine-groups";
import type { RoutineItem } from "../routine-types";
import type { StoredHeader } from "../types";
import { blockSlots, optionalAvailable, optionalValueRange } from "./slots";
import type { Ruleset, ValueRange } from "./types";

type RequirementStatus = {
  expected: number;
  actual: number;
  /** Optionals: the value an element from TOD WG must have. */
  valueRange?: ValueRange;
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
  /** Requirements the catalog can't offer yet: listed, not penalised. */
  pendingMessages: string[];
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
  pendingMessages: [],
});

export function evaluateRules(
  ruleset: Ruleset | null,
  header: StoredHeader | null,
  routine: RoutineItem[],
): RuleStatus {
  if (!ruleset) return disabled();

  const count = (role: "compulsory" | "optional", block: "balance" | "dynamic") =>
    routine.filter((item) => item.role === role && item.block === block).length;

  const balanceSlots = blockSlots(ruleset, "balance", header?.category);
  const dynamicSlots = blockSlots(ruleset, "dynamic", header?.category);
  const pendingMessages: string[] = [];

  // Optional elements come from tables the catalog may not have yet (e.g. Nacional, FIG).
  const optionalOffered = !header || optionalAvailable(ruleset, header.levelAge);
  if (!optionalOffered && (balanceSlots.optional > 0 || dynamicSlots.optional > 0)) {
    pendingMessages.push("Elementos opcionales: próximamente (tablas de nivel superior).");
  }
  const optionalExpected = (slots: { optional: number }) => (optionalOffered ? slots.optional : 0);

  const compulsoryBalance = status(balanceSlots.compulsory, count("compulsory", "balance"));
  const compulsoryDynamic = status(dynamicSlots.compulsory, count("compulsory", "dynamic"));
  const withRange = (s: RequirementStatus, block: "balance" | "dynamic") => {
    const valueRange = header ? optionalValueRange(ruleset, header, block) : null;
    return valueRange ? { ...s, valueRange } : s;
  };
  const optionalBalance = withRange(
    status(optionalExpected(balanceSlots), count("optional", "balance")),
    "balance",
  );
  const optionalDynamic = withRange(
    status(optionalExpected(dynamicSlots), count("optional", "dynamic")),
    "dynamic",
  );

  const gymnastCount = header ? gymnastCountForCategory(header.category) : 2;
  const { complete } = countCompleteIndividualSets(routine, gymnastCount);
  if (!ruleset.individuals.available) {
    pendingMessages.push("Elementos individuales: próximamente.");
  }
  const individualPerGymnast = status(
    ruleset.individuals.available ? ruleset.individuals.sets : 0,
    complete,
  );

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
      `Faltan sets individuales (${complete}/${ruleset.individuals.sets} completos).`,
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
    pendingMessages,
  };
}
