import type { RoutineItem } from "../routine-types";
import type { ValueBreakdown } from "../types";

/** Sum element values for the sidebar — compulsory balance/dynamic only; no individual DV. */
export function recalculateValueBreakdown(
  routine: RoutineItem[],
): ValueBreakdown {
  let balance = 0;
  let dynamic = 0;

  for (const item of routine) {
    if (item.role !== "compulsory") continue;
    if (item.block === "balance") balance += item.element.value;
    else if (item.block === "dynamic") dynamic += item.element.value;
  }

  return {
    balance,
    dynamic,
    individual: 0,
    total: balance + dynamic,
  };
}
