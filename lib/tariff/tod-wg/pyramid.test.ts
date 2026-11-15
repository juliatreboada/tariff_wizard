import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import { itemValue } from "../item-value";
import type { RoutineItem, TodWgPick } from "../routine-types";
import { baseById, todWgCatalogId } from "./index";
import { pyramidOf } from "./pyramid";

/** A routine item for a TOD WG base, as the picker will save it. */
const pyramid = (id: string, todWg: TodWgPick, category?: number): RoutineItem => {
  const base = baseById(id, category)!;
  const entry = getCatalogEntries("FIG").find((e) => e.id === todWgCatalogId(base))!;
  return { id: "p1", block: "balance", linkedToPrevious: false, role: "compulsory", element: catalogEntryToPlaced(entry), todWg };
};

describe("TOD WG pyramid value", () => {
  it("is the base plus the top's value for the base group (58 A13, group 1, Tab2 C on Dos manos)", () => {
    const p = pyramid("58 A13", { tops: [{ slot: "top", table: 2, support: "Dos manos", position: "C" }] });
    expect(pyramidOf(p)).toMatchObject({ value: 4 + 7, problems: [] });
    expect(itemValue(p)).toBe(11);
  });

  it("adds a motion and +1 for legs together", () => {
    const p = pyramid("58 A13", {
      tops: [{ slot: "top", table: 2, support: "Dos manos", position: "C" }],
      motion: "C->D",
      legsTogether: true,
    });
    expect(itemValue(p)).toBe(4 + 7 + 4 + 1);
  });

  it("adds both tops for Category 2: the top and the middle acting as a top", () => {
    const p = pyramid("59 E10", {
      tops: [
        { slot: "top", table: 3, support: "Hombros", position: "1" },
        { slot: "middle", table: 9, support: "Pies", position: "A" },
      ],
    });
    expect(pyramidOf(p)).toMatchObject({ value: 4 + 1 + 2, problems: [] });
  });

  it("reads a box option's value (Tab3 5b)", () => {
    const p = pyramid("59 E10", {
      tops: [
        { slot: "top", table: 3, support: "Hombros", position: "5", option: "b" },
        { slot: "middle", table: 9, support: "Pies", position: "A" },
      ],
    });
    expect(itemValue(p)).toBe(4 + 2 + 2);
  });

  it("doesn't count a top on a support the base can't give, and says why", () => {
    const p = pyramid("58 A13", { tops: [{ slot: "top", table: 2, support: "Dos pies", position: "C" }] });
    const r = pyramidOf(p)!;
    expect(r.value).toBe(4);
    expect(r.problems).toHaveLength(1);
  });

  it("doesn't count a position that isn't possible on that support (Tab1 A on Dos manos bajas)", () => {
    const p = pyramid("59 B2", { tops: [{ slot: "top", table: 1, support: "Dos manos bajas", position: "A" }] });
    expect(pyramidOf(p)!.problems).toHaveLength(1);
  });

  it("says which top steps are missing", () => {
    const p = pyramid("59 E10", { tops: [{ slot: "top", table: 3, support: "Hombros", position: "1" }] });
    expect(pyramidOf(p)!.missing).toEqual(["middle"]);
  });

  it("needs no top when the drawing already has it", () => {
    const p = pyramid("61 A5", { tops: [] });
    expect(pyramidOf(p)).toMatchObject({ value: p.element.value, missing: [], problems: [] });
  });

  it("isn't a pyramid for other elements", () => {
    const fgx = getCatalogEntries("FGX")[0];
    const item: RoutineItem = { id: "x", block: "balance", linkedToPrevious: false, element: catalogEntryToPlaced(fgx) };
    expect(pyramidOf(item)).toBeNull();
  });
});

describe("TOD WG catalog ids", () => {
  it("matches every base to its catalog entry", () => {
    const ids = new Set(getCatalogEntries("FIG").map((e) => e.id));
    expect(ids.has(todWgCatalogId(baseById("64 A1", 7)!))).toBe(true);
    expect(ids.has(todWgCatalogId(baseById("59 C3 +2")!))).toBe(true);
  });
});

describe("saved TOD WG pyramids", () => {
  it("keep their choices when a saved routine is refreshed from the catalog", async () => {
    const { refreshRoutineFromCatalog } = await import("../migrate-routine");
    const todWg: TodWgPick = { tops: [{ slot: "top", table: 2, support: "Dos manos", position: "C" }], motion: "C->D" };
    const saved = pyramid("58 A13", todWg);
    const stale = { ...saved, element: { ...saved.element, value: 99 } };
    const [refreshed] = refreshRoutineFromCatalog([stale]);
    expect(refreshed.todWg).toEqual(todWg);
    expect(refreshed.element.value).toBe(4);
    expect(itemValue(refreshed)).toBe(4 + 7 + 4);
  });
});

describe("pyramid edge cases", () => {
  it("doesn't count legs together without a top", () => {
    const r = pyramidOf(pyramid("58 A13", { tops: [], legsTogether: true }))!;
    expect(r.legs).toBe(0);
    expect(r.value).toBe(4);
    expect(r.problems).toHaveLength(1);
  });

  it("counts legs together on a base whose drawing has the top", () => {
    const p = pyramid("61 A5", { tops: [], legsTogether: true });
    expect(pyramidOf(p)!.value).toBe(p.element.value + 1);
  });

  it("takes the motion from the top, not the middle acting as a top", () => {
    const p = pyramid("59 E10", {
      tops: [{ slot: "middle", table: 9, support: "Pies", position: "A" }],
      motion: "A->B",
    });
    expect(pyramidOf(p)!.motion).toBeUndefined();
    expect(pyramidOf(p)!.problems).toHaveLength(1);
  });

  it("finds no base for other catalog ids", async () => {
    const { baseForCatalogId } = await import("./index");
    expect(baseForCatalogId("fig-pre-youth-trios-balance-row-i-1")).toBeUndefined();
  });
});
