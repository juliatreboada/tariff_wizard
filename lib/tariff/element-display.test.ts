import { describe, expect, it } from "vitest";
import type { SheetColumnSlot } from "./compute-sheet-layout";
import { getCatalogEntries } from "./catalog/load-catalog";
import { catalogEntryToPlaced } from "./catalog/to-placed";
import {
  formatSidebarBreakdownValue,
  SHEET_NO_VALUE,
  sheetCoordinatesInRow,
  sheetSlotMetaDisplay,
  sheetValueInSubcell,
} from "./element-display";
import { item } from "./test-fixtures";

function elementSlot(
  id: string,
  role: "compulsory" | "optional",
): SheetColumnSlot {
  const it = item(id, { role });
  return {
    kind: "element",
    routineItemId: it.id,
    element: it.element,
    elementNumber: 1,
    block: it.block,
    role,
  };
}

const individualSlot: SheetColumnSlot = {
  kind: "individual-group",
  routineItemIds: ["a", "b"],
  elements: [
    { ...item("fgx-individual-eq-1").element, value: 0.5 },
    { ...item("fgx-individual-eq-2").element, value: 0.5 },
  ],
  elementNumber: 2,
};

describe("sheet VALUE row", () => {
  it("shows compulsory values and hides optional ones", () => {
    expect(sheetValueInSubcell(elementSlot("fgx-balance-row-i-c", "compulsory"), 0, true)).toBe("0.2");
    expect(sheetValueInSubcell(elementSlot("fgx-balance-row-i-c", "optional"), 0, true)).toBe(SHEET_NO_VALUE);
    expect(sheetValueInSubcell(elementSlot("fgx-dynamic-row-i-d", "compulsory"), 1, true)).toBe("0.3");
  });

  it("puts balance in subcell 1 and dynamic in subcell 2 only", () => {
    expect(sheetValueInSubcell(elementSlot("fgx-balance-row-i-c", "compulsory"), 1, true)).toBe("");
    expect(sheetValueInSubcell(elementSlot("fgx-dynamic-row-i-c", "compulsory"), 0, true)).toBe("");
  });

  it("hides individual values in ESCOLAR and shows them otherwise", () => {
    expect(sheetValueInSubcell(individualSlot, 0, true)).toBe(SHEET_NO_VALUE);
    expect(sheetValueInSubcell(individualSlot, 1, false)).toBe("0.5");
    expect(sheetValueInSubcell(individualSlot, 2, true)).toBe("");
  });
});

describe("sidebar breakdown", () => {
  const breakdown = { total: 0.5, balance: 0.3, dynamic: 0.2, individual: 0.4 };

  it("hides the individual subtotal only in ESCOLAR", () => {
    expect(formatSidebarBreakdownValue("individual", breakdown, true)).toBe(SHEET_NO_VALUE);
    expect(formatSidebarBreakdownValue("individual", breakdown, false)).toBe("0.4");
    expect(formatSidebarBreakdownValue("balance", breakdown, true)).toBe("0.3");
  });
});

describe("a pyramid with an add-on (Cuartetos ROW III)", () => {
  const rfeg = (id: string) =>
    catalogEntryToPlaced(getCatalogEntries("RFEG").find((e) => e.id === `rfeg-base-${id}`)!);
  const slot: SheetColumnSlot = {
    kind: "element",
    routineItemId: "x",
    element: rfeg("cadete-cuartetos-balance-row-ii-d"), // 0.3
    addOn: rfeg("cadete-cuartetos-balance-row-iii-c"), // 0.2
    elementNumber: 1,
    block: "balance",
    role: "compulsory",
  };

  it("adds the values and lists both codes in one cell", () => {
    expect(sheetValueInSubcell(slot, 0, true)).toBe("0.5");
    expect(sheetCoordinatesInRow(slot, "sh")).toBe("ROW-II D + ROW-III C");
    expect(sheetSlotMetaDisplay(slot)).toBe('3"');
  });
});
