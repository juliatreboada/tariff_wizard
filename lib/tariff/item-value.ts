import type { RoutineItem } from "./routine-types";
import { pyramidOf } from "./tod-wg/pyramid";

/**
 * Value of one routine element: the element plus what's performed with it
 * (an add-on), or a TOD WG pyramid's base + tops + motion + legs together
 * (+ the transition from the pyramid before it, when `routine` is given).
 */
export function itemValue(item: RoutineItem, routine?: readonly RoutineItem[]): number {
  // A TOD WG pyramid takes no add-on: its parts are in `todWg`.
  return pyramidOf(item, routine)?.value ?? item.element.value + (item.addOn?.value ?? 0);
}
