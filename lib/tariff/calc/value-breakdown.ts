import type { RoutineItem } from "../routine-types";
import type { ValueBreakdown } from "../types";

export function recalculateValueBreakdown(
  routine: RoutineItem[],
): ValueBreakdown {
  let balance = 0;
  let dynamic = 0;
  let individual = 0;

  for (const item of routine) {
    if (item.block === "balance") balance += item.element.value;
    else if (item.block === "dynamic") dynamic += item.element.value;
    else if (item.block === "combined") individual += item.element.value;
  }

  return {
    balance,
    dynamic,
    individual,
    total: balance + dynamic + individual,
  };
}
