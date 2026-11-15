import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import { computeSheetLayout } from "../compute-sheet-layout";
import { sheetCoordinatesInRow, sheetValueInSubcell } from "../element-display";
import type { RoutineItem, TodWgPick } from "../routine-types";
import { baseById, todWgCatalogId } from "./index";

const pyramid = (id: string, sheetId: string, todWg: TodWgPick, linkedToPrevious = false): RoutineItem => {
  const entry = getCatalogEntries("FIG").find((e) => e.id === todWgCatalogId(baseById(id)!))!;
  return { id: sheetId, block: "balance", linkedToPrevious, role: "compulsory", element: catalogEntryToPlaced(entry), todWg };
};
const first = pyramid("58 A13", "p1", { tops: [{ slot: "top", table: 2, support: "Dos manos", position: "C" }] });
const columns = (routine: RoutineItem[]) => computeSheetLayout(routine, "Balance").blocks[0].columns;

describe("transition on the sheet", () => {
  it("fills the open cell between the two pyramids", () => {
    const cols = columns([first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })]);
    expect(cols.slice(0, 3).map((c) => c.kind)).toEqual(["element", "transition", "element"]);
  });

  it("keeps an open cell for the transition even when the pyramid is linked", () => {
    const cols = columns([first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true }, true)]);
    expect(cols.slice(0, 3).map((c) => c.kind)).toEqual(["element", "transition", "element"]);
  });

  it("shows the transition value in C and the transitions page in BASE", () => {
    const [, transition] = columns([first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })]);
    expect([0, 1, 2, 3].map((i) => sheetValueInSubcell(transition, i, false))).toEqual(["", "", "3.0", ""]);
    expect(sheetCoordinatesInRow(transition, "base")).toBe("52");
    expect(sheetCoordinatesInRow(transition, "sh")).toBe("");
  });

  it("doesn't count the transition again in the second pyramid's cell", () => {
    const cols = columns([first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })]);
    expect(sheetValueInSubcell(cols[2], 2, false)).toBe("15.0");
  });

  it("leaves a plain open cell when there's no pyramid before", () => {
    const cols = columns([pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })]);
    expect(cols[0].kind).toBe("element");
  });
});

describe("transition at the edges of the sheet", () => {
  it("writes 52 in SH in the last block, where BASE is the footer", () => {
    const [, transition] = columns([first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })]);
    expect(sheetCoordinatesInRow(transition, "sh", { baseInSh: true })).toBe("52");
  });

  it("never leaves an arrow without its pyramid when the sheet runs out of columns", () => {
    const fgx = getCatalogEntries("FGX").filter((e) => e.elementFamily === "balance");
    const fillers: RoutineItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `f${i}`,
      block: "balance",
      linkedToPrevious: true,
      role: "compulsory",
      element: catalogEntryToPlaced(fgx[i % fgx.length]),
    }));
    const routine = [...fillers, { ...first, linkedToPrevious: true }, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })];
    const timeline = computeSheetLayout(routine, "Balance").blocks.flatMap((b) => b.columns);
    expect(timeline.at(-1)?.kind).not.toBe("transition");
  });
});

describe("transition in the totals", () => {
  it("counts once in the value breakdown", async () => {
    const { recalculateValueBreakdown } = await import("../calc/value-breakdown");
    const routine = [first, pyramid("60 C8", "p2", { tops: [], transitionFromPrevious: true })];
    expect(recalculateValueBreakdown(routine).balance).toBe(4 + 7 + 15 + 3);
  });
});
