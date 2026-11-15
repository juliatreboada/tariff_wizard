import { describe, expect, it } from "vitest";
import { recalculateValueBreakdown } from "../calc/value-breakdown";
import { getCatalogEntries } from "../catalog/load-catalog";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import { computeSheetLayout } from "../compute-sheet-layout";
import { sheetCoordinatesInRow, sheetSlotMetaDisplay, sheetValueInSubcell } from "../element-display";
import type { RoutineItem, TodWgPick, TodWgTopPick } from "../routine-types";
import { baseById, todWgCatalogId } from "./index";

const pyramid = (id: string, itemId: string, todWg: TodWgPick, linkedToPrevious = false): RoutineItem => {
  const entry = getCatalogEntries("FIG").find((e) => e.id === todWgCatalogId(baseById(id)!))!;
  return { id: itemId, block: "balance", linkedToPrevious, role: "compulsory", element: catalogEntryToPlaced(entry), todWg };
};
const tab2 = (position: string): TodWgTopPick => ({ slot: "top", table: 2, support: "Dos manos", position });
const first = (hold: 1 | 3 = 3) => pyramid("58 A13", "p1", { tops: [tab2("C")], hold });
const motionTo = (position: string, linked = false) =>
  pyramid("58 A13", "p2", { tops: [tab2(position)], from: { transition: false, moves: [{ slot: "top", how: "motion" }] } }, linked);
const transitionTo = (how: "held" | "no-value" | "motion") =>
  pyramid("58 B1", "p2", { tops: [tab2("D")], from: { transition: true, moves: [{ slot: "top", how }] } });
const columns = (routine: RoutineItem[]) => computeSheetLayout(routine, "Balance").blocks[0].columns;
const values = (slot: ReturnType<typeof columns>[number]) => [0, 1, 2, 3].map((i) => sheetValueInSubcell(slot, i, false));

describe("a motion on the sheet: three cells", () => {
  it("puts the first hold, the motion and the next hold in three cells", () => {
    expect(columns([first(), motionTo("D")]).slice(0, 3).map((c) => c.kind)).toEqual(["element", "link", "element"]);
  });

  it("keeps the link cell even when the next hold is linked", () => {
    expect(columns([first(), motionTo("D", true)]).slice(0, 3).map((c) => c.kind)).toEqual(["element", "link", "element"]);
  });

  it("values a 3\" first hold, the motion in B, then the new top without repeating the base", () => {
    const [hold1, link, hold2] = columns([first(), motionTo("D")]);
    expect(values(hold1)).toEqual(["7", "", "4", ""]);
    expect(values(link)).toEqual(["", "4", "", ""]);
    expect(values(hold2)).toEqual(["5", "", "", ""]);
    expect(sheetCoordinatesInRow(link, "top")).toBe("54/Tab2 - C->D");
    expect(sheetCoordinatesInRow(hold2, "base")).toBe("58 A13");
  });

  it("shows a 1\" first hold without values, and the base in the next hold", () => {
    const [hold1, , hold2] = columns([first(1), motionTo("D")]);
    expect(sheetSlotMetaDisplay(hold1)).toBe('1"');
    expect(values(hold1)).toEqual(["", "", "", ""]);
    expect(values(hold2)).toEqual(["5", "", "4", ""]);
    expect(sheetSlotMetaDisplay(hold2)).toBe('3"');
  });

  it("counts everything once in the totals", () => {
    expect(recalculateValueBreakdown([first(), motionTo("D")]).balance).toBe(4 + 7 + 4 + 5);
    expect(recalculateValueBreakdown([first(1), motionTo("D")]).balance).toBe(4 + 5 + 4);
  });
});

describe("a transition on the sheet", () => {
  it("puts the transition in C with 52, and a held top in A with its position", () => {
    const [, link, hold2] = columns([first(), transitionTo("held")]);
    expect(values(link)).toEqual(["7", "", "1", ""]);
    expect(sheetCoordinatesInRow(link, "sh")).toBe("54/Tab2 - C");
    expect(sheetCoordinatesInRow(link, "base")).toBe("52");
    expect(values(hold2)).toEqual(["5", "", "3", ""]);
  });

  it("writes 52 in BASE, never in SH", () => {
    const [, link] = columns([first(), transitionTo("no-value")]);
    expect(sheetCoordinatesInRow(link, "base")).toBe("52");
    expect(sheetCoordinatesInRow(link, "sh")).toBe("");
  });

  it("puts the top's motion during the transition in B", () => {
    const [, link] = columns([first(), transitionTo("motion")]);
    expect(values(link)).toEqual(["", "4", "1", ""]);
  });
});

describe("edges of the sheet", () => {
  it("leaves a plain open cell when there's no pyramid before", () => {
    expect(columns([motionTo("D")])[0].kind).toBe("element");
  });

  it("never leaves a link without its next hold when the sheet runs out of columns", () => {
    const fgx = getCatalogEntries("FGX").filter((e) => e.elementFamily === "balance");
    const fillers: RoutineItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `f${i}`,
      block: "balance",
      linkedToPrevious: true,
      role: "compulsory",
      element: catalogEntryToPlaced(fgx[i % fgx.length]),
    }));
    const routine = [...fillers, { ...first(), linkedToPrevious: true }, motionTo("D")];
    const timeline = computeSheetLayout(routine, "Balance").blocks.flatMap((b) => b.columns);
    expect(timeline.at(-1)?.kind).not.toBe("link");
  });
});
