import type { RoutineItem } from "../routine-types";
import type { ValueBreakdown } from "../types";
import { itemValue } from "../item-value";

/** Sum element values for the sidebar — compulsory balance/dynamic (with add-ons) only; no individual DV. */
export function recalculateValueBreakdown(
  routine: RoutineItem[],
): ValueBreakdown {
  let balance = 0;
  let dynamic = 0;

  for (const item of routine) {
    if (item.role !== "compulsory") continue;
    const value = itemValue(item, routine);
    if (item.block === "balance") balance += value;
    else if (item.block === "dynamic") dynamic += value;
  }

  return {
    balance,
    dynamic,
    individual: 0,
    total: balance + dynamic,
  };
}
