import type { RoutineItem } from "./routine-types";
import { pyramidOf } from "./tod-wg/pyramid";

/**
 * Value of one routine element: the element plus what's performed with it
 * (an add-on), or a TOD WG pyramid's base + tops + motion + legs together.
 */
export function itemValue(item: RoutineItem): number {
  // A TOD WG pyramid takes no add-on: its parts are in `todWg`.
  return pyramidOf(item)?.value ?? item.element.value + (item.addOn?.value ?? 0);
}
