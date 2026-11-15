import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "./catalog/load-catalog";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import type { CatalogId } from "./catalog/types";
import { itemValue } from "./item-value";
import type { RoutineItem } from "./routine-types";

const placed = (catalog: CatalogId, id: string) => {
  const e = getCatalogEntries(catalog).find((x) => x.id === id);
  if (!e) throw new Error(`no entry ${id}`);
  return catalogEntryToPlaced(e);
};
const routineItem = (element: RoutineItem["element"], extra: Partial<RoutineItem> = {}): RoutineItem => ({
  id: "i1",
  block: "balance",
  linkedToPrevious: false,
  role: "compulsory",
  element,
  ...extra,
});

describe("itemValue (today's behaviour)", () => {
  it("is the element's value", () => {
    const el = placed("FGX", "fgx-balance-row-i-b");
    expect(itemValue(routineItem(el))).toBe(el.value);
  });

  it("adds an add-on's value (Cuartetos ROW III on a ROW I pyramid)", () => {
    const pyramid = placed("RFEG", "rfeg-base-alevin-cuartetos-balance-row-i-a");
    const addOn = placed("RFEG", "rfeg-base-alevin-cuartetos-balance-row-iii-b");
    expect(itemValue(routineItem(pyramid, { addOn }))).toBeCloseTo(pyramid.value + addOn.value);
  });
});
