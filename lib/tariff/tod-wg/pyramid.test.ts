import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import { catalogEntryToPlaced } from "../catalog/to-placed";
import { itemValue } from "../item-value";
import type { RoutineItem, TodWgPick, TodWgTopPick } from "../routine-types";
import { baseById, todWgCatalogId } from "./index";
import { pyramidOf } from "./pyramid";

/** A routine item for a TOD WG base, as the picker saves it. */
const pyramid = (id: string, todWg: TodWgPick, itemId = "p1", category?: number): RoutineItem => {
  const base = baseById(id, category)!;
  const entry = getCatalogEntries("FIG").find((e) => e.id === todWgCatalogId(base))!;
  return { id: itemId, block: "balance", linkedToPrevious: false, role: "compulsory", element: catalogEntryToPlaced(entry), todWg };
};
const tab2 = (position: string): TodWgTopPick => ({ slot: "top", table: 2, support: "Dos manos", position });

describe("TOD WG static hold value", () => {
  it("is the base plus the top's value for the base group (58 A13, group 1, Tab2 C on Dos manos)", () => {
    const p = pyramid("58 A13", { tops: [tab2("C")] });
    expect(pyramidOf(p)).toMatchObject({ value: 4 + 7, problems: [], hold: 3, cell: { tops: 7, base: 4, legs: null } });
    expect(itemValue(p)).toBe(11);
  });

  it("adds +1 for legs together", () => {
    expect(itemValue(pyramid("58 A13", { tops: [tab2("C")], legsTogether: true }))).toBe(4 + 7 + 1);
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

  it("has no value at all when the hold is 1\" (only shown, before a motion)", () => {
    const r = pyramidOf(pyramid("58 A13", { tops: [tab2("C")], hold: 1, legsTogether: true }))!;
    expect(r).toMatchObject({ hold: 1, value: 0, cell: { tops: null, base: null, legs: null } });
  });

  it("doesn't count a top on a support the base can't give, and says why", () => {
    const r = pyramidOf(pyramid("58 A13", { tops: [{ ...tab2("C"), support: "Dos pies" }] }))!;
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

  it("needs no top when the drawing already has it, and counts legs together there", () => {
    const p = pyramid("61 A5", { tops: [], legsTogether: true });
    expect(pyramidOf(p)).toMatchObject({ value: p.element.value + 1, missing: [], problems: [] });
  });

  it("doesn't count legs together without a top", () => {
    const r = pyramidOf(pyramid("58 A13", { tops: [], legsTogether: true }))!;
    expect(r.legs).toBe(0);
    expect(r.value).toBe(4);
    expect(r.problems).toHaveLength(1);
  });

  it("isn't a pyramid for other elements", () => {
    const fgx = getCatalogEntries("FGX")[0];
    const item: RoutineItem = { id: "x", block: "balance", linkedToPrevious: false, element: catalogEntryToPlaced(fgx) };
    expect(pyramidOf(item)).toBeNull();
  });
});

describe("a motion without transition (same base)", () => {
  const first = pyramid("58 A13", { tops: [tab2("C")] }, "p1");
  const next = pyramid("58 A13", { tops: [tab2("D")], from: { transition: false, moves: [{ slot: "top", how: "motion" }] } }, "p2");

  it("values the motion between the two holds and the new top, but not the base again", () => {
    const routine = [first, next];
    const r = pyramidOf(next, routine)!;
    expect(r.link).toMatchObject({ motions: [{ slot: "top", id: "54/Tab2 - C->D", value: 4 }], value: 4 });
    expect(r.cell).toEqual({ tops: 5, base: null, legs: null });
    expect(itemValue(next, routine)).toBe(4 + 5);
    expect(itemValue(first, routine)).toBe(4 + 7);
  });

  it("counts the base in the next hold when the first hold was 1\"", () => {
    const routine = [{ ...first, todWg: { ...first.todWg!, hold: 1 as const } }, next];
    expect(itemValue(routine[0], routine)).toBe(0);
    expect(itemValue(next, routine)).toBe(4 + 5 + 4);
  });

  it("needs a motion when the bases don't make a transition", () => {
    const still = pyramid("58 A13", { tops: [tab2("D")], from: { transition: false, moves: [{ slot: "top", how: "no-value" }] } }, "p2");
    expect(pyramidOf(still, [first, still])!.problems.length).toBeGreaterThan(0);
  });

  it("keeps the same base without a transition", () => {
    const other = pyramid("58 B1", { tops: [tab2("D")], from: { transition: false, moves: [{ slot: "top", how: "motion" }] } }, "p2");
    expect(pyramidOf(other, [first, other])!.problems).toContain("Sin transición la base es la misma que antes.");
  });

  it("gives a motion to another table no value", () => {
    const toTab4 = pyramid(
      "58 A13",
      { tops: [{ slot: "top", table: 4, support: "Dos manos", position: "6" }], from: { transition: false, moves: [{ slot: "top", how: "motion" }] } },
      "p2",
    );
    const r = pyramidOf(toTab4, [first, toTab4])!;
    expect(r.link?.motions).toEqual([{ slot: "top", id: undefined, value: 0 }]);
    expect(r.cell.tops).toBe(2);
  });

  it("isn't a continuation without a pyramid right before, and says why", () => {
    const r = pyramidOf(next, [next])!;
    expect(r.link).toBeUndefined();
    expect(r.cell.base).toBe(4);
    expect(r.problems).toContain("La continuación necesita una pirámide justo antes.");
  });
});

describe("a transition of the bases", () => {
  const first = pyramid("58 A13", { tops: [tab2("C")] }, "p1");
  const after = (how: "held" | "no-value" | "motion", position = "D") =>
    pyramid("58 B1", { tops: [tab2(position)], from: { transition: true, moves: [{ slot: "top", how }] } }, "p2");

  it("adds the transition and, if the top holds a valued position, the top's value", () => {
    const next = after("held");
    const r = pyramidOf(next, [first, next])!;
    expect(r.link).toMatchObject({ transition: { value: 1 }, held: [{ id: "54/Tab2 - C", value: 7 }], value: 1 + 7 });
    // The new base counts, and the new top is valued for the previous base's group.
    expect(r.cell).toEqual({ tops: 5, base: 3, legs: null });
    expect(itemValue(next, [first, next])).toBe(1 + 7 + 5 + 3);
  });

  it("adds nothing for a top in a position of no value", () => {
    const next = after("no-value");
    expect(pyramidOf(next, [first, next])!.link?.value).toBe(1);
  });

  it("adds the top's motion during the transition", () => {
    const next = after("motion");
    expect(pyramidOf(next, [first, next])!.link?.value).toBe(1 + 4);
  });

  it("needs a new base", () => {
    const same = pyramid("58 A13", { tops: [tab2("D")], from: { transition: true, moves: [{ slot: "top", how: "held" }] } }, "p2");
    const r = pyramidOf(same, [first, same])!;
    expect(r.link?.transition).toBeUndefined();
    expect(r.problems).toContain("Con transición la base cambia: elige la nueva base.");
  });

  it("lets only a transition hold a position", () => {
    const held = pyramid("58 A13", { tops: [tab2("D")], from: { transition: false, moves: [{ slot: "top", how: "held" }] } }, "p2");
    expect(pyramidOf(held, [first, held])!.link?.held).toEqual([]);
  });
});

describe("Category 2 motions", () => {
  it("values the middle acting as a top's motion too", () => {
    const tops = (middle: string): TodWgTopPick[] => [
      { slot: "top", table: 3, support: "Hombros", position: "1" },
      { slot: "middle", table: 9, support: "Pies", position: middle },
    ];
    const first = pyramid("59 E10", { tops: tops("A") }, "p1");
    const next = pyramid("59 E10", { tops: tops("B"), from: { transition: false, moves: [{ slot: "middle", how: "motion" }] } }, "p2");
    const r = pyramidOf(next, [first, next])!;
    expect(r.link?.motions).toEqual([{ slot: "middle", id: "56/Tab9 - A->B", value: 1 }]);
    expect(r.value).toBe(1 + (1 + 2));
  });
});

describe("TOD WG catalog ids", () => {
  it("matches every base to its catalog entry", () => {
    const ids = new Set(getCatalogEntries("FIG").map((e) => e.id));
    expect(ids.has(todWgCatalogId(baseById("64 A1", 7)!))).toBe(true);
    expect(ids.has(todWgCatalogId(baseById("59 C3 +2")!))).toBe(true);
  });

  it("finds no base for other catalog ids", async () => {
    const { baseForCatalogId } = await import("./index");
    expect(baseForCatalogId("fig-pre-youth-trios-balance-row-i-1")).toBeUndefined();
  });
});

describe("saved TOD WG pyramids", () => {
  it("keep their choices when a saved routine is refreshed from the catalog", async () => {
    const { refreshRoutineFromCatalog } = await import("../migrate-routine");
    const todWg: TodWgPick = { tops: [tab2("C")], hold: 1 };
    const saved = pyramid("58 A13", todWg);
    const stale = { ...saved, element: { ...saved.element, value: 99 } };
    const [refreshed] = refreshRoutineFromCatalog([stale]);
    expect(refreshed.todWg).toEqual(todWg);
    expect(refreshed.element.value).toBe(4);
  });
});

describe("chains of three static holds", () => {
  it("values each motion for the group of the base the top moves from", () => {
    // 58 C4 (group 2) → transition → 58 A1 (group 1) → motion: valued for 58 A1's group.
    const hold1 = pyramid("58 C4", { tops: [] }, "h1");
    const hold2 = pyramid("58 A1", { tops: [], from: { transition: true, moves: [] } }, "h2");
    const hold3 = pyramid(
      "58 A1",
      { tops: [{ slot: "top", table: 2, support: "Dos pies", position: "C" }], from: { transition: false, moves: [{ slot: "top", how: "motion" }] } },
      "h3",
    );
    const r = pyramidOf(hold3, [hold1, hold2, hold3])!;
    expect(r.group).toBe(1);
    expect(r.cell.tops).toBe(7); // Tab2 C, group 1
    expect(r.cell.base).toBeNull(); // same base as hold 2: counted once
  });
});

describe("a transition can't go back to a base already used", () => {
  it("says so, and doesn't count the transition", () => {
    const hold1 = pyramid("58 A13", { tops: [tab2("C")] }, "h1");
    const hold2 = pyramid("58 B1", { tops: [tab2("D")], from: { transition: true, moves: [{ slot: "top", how: "no-value" }] } }, "h2");
    const hold3 = pyramid("58 A13", { tops: [tab2("C")], from: { transition: true, moves: [{ slot: "top", how: "no-value" }] } }, "h3");
    const r = pyramidOf(hold3, [hold1, hold2, hold3])!;
    expect(r.problems).toContain("Esa base ya está en la rutina: la transición tiene que ir a otra.");
    expect(r.link?.transition).toBeUndefined();
  });
});
