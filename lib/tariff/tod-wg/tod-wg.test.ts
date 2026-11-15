import { describe, expect, it } from "vitest";
import {
  baseById,
  baseGroup,
  motionOptions,
  supportOptions,
  todWgBases,
  topPositions,
  topSlots,
  transitionValue,
} from "./index";

const ALL_SUPPORTS = [
  "Dos manos", "Dos manos bajas", "Dos pies", "Pies", "Una mano",
  "Una mano baja", "Un pie", "Manos superpuestas", "Hombros", "Otros",
];

const base = (id: string, category?: number) => {
  const b = baseById(id, category);
  if (!b) throw new Error(`no base ${id}`);
  return b;
};

describe("TOD WG base groups", () => {
  it("reads the base group from the base value (1: 1-8, 2: 9-13, 3: 14-17, 4: 18+)", () => {
    expect([1, 8, 9, 13, 14, 17, 18, 44].map(baseGroup)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("tells the two 64 A1 bases apart by category", () => {
    expect(base("64 A1", 6).value).toBe(7);
    expect(base("64 A1", 7).value).toBe(12);
  });
});

describe("top steps of a base", () => {
  it("gives one top step with the base's supports", () => {
    expect(topSlots(base("58 A13"))).toEqual([
      { slot: "top", supports: ["Dos manos", "Manos superpuestas", "Hombros"] },
    ]);
  });

  it("gives no top step when the drawing already has the top", () => {
    expect(topSlots(base("61 A5"))).toEqual([]);
    expect(topSlots(base("64 A1", 7))).toEqual([]);
  });

  it("gives Category 2 a second step for the middle acting as a top", () => {
    const slots = topSlots(base("59 E10"));
    expect(slots.map((s) => s.slot)).toEqual(["top", "middle"]);
    expect(slots[1].supports).toEqual(["Pies"]);
  });
});

describe("support tables a base can use", () => {
  it("offers only the tables with a drawing of an allowed support", () => {
    const offered = supportOptions(["Dos manos"]).map((o) => `${o.table} ${o.support}`);
    expect(offered).toEqual(["2 Dos manos", "4 Dos manos", "5 Dos manos"]);
  });

  it("never offers a support the base can't give", () => {
    const offered = supportOptions(["Dos manos"]);
    expect(offered.some((o) => o.support === "Dos pies")).toBe(false);
    expect(offered.some((o) => o.table === 12)).toBe(false);
  });

  it("offers a table once per support, with both drawings when they share it (Table 8)", () => {
    const t8 = supportOptions(["Una mano baja"]).filter((o) => o.table === 8);
    expect(t8).toHaveLength(1);
    expect(t8[0].images).toHaveLength(2);
  });

  it("offers each of a table's supports separately when the base allows both", () => {
    const t2 = supportOptions(["Dos manos", "Dos pies"]).filter((o) => o.table === 2);
    expect(t2.map((o) => o.support)).toEqual(["Dos manos", "Dos pies"]);
  });
});

describe("top positions and their value", () => {
  it("reads the top value for the base group", () => {
    const c = topPositions(1, "Otros", 3).find((p) => p.key === "C");
    expect(c).toMatchObject({ id: "54/Tab1 - C", value: 8 });
  });

  it("leaves out positions that can't be done on that support (Tab1 A, B on Dos manos bajas)", () => {
    const keys = (support: string) => topPositions(1, support, 1).map((p) => p.key);
    expect(keys("Dos manos bajas")).not.toContain("A");
    expect(keys("Dos manos bajas")).not.toContain("B");
    expect(keys("Otros")).toEqual(expect.arrayContaining(["A", "B"]));
  });

  it("gives every option of a box with several drawings, +1 applied (Tab4 10)", () => {
    const ten = topPositions(4, "Dos manos", 2).filter((p) => p.key === "10");
    expect(ten.map((p) => [p.option, p.value])).toEqual([
      ["a", 3],
      ["b", 3],
      ["c", 4],
    ]);
  });

  it("returns nothing for a support the table doesn't have", () => {
    expect(topPositions(1, "Dos manos", 1)).toEqual([]);
  });
});

describe("motions", () => {
  it("reads a motion's value for the base group", () => {
    const ad = motionOptions(1, "Otros", 2).find((m) => m.key === "A->D");
    expect(ad).toMatchObject({ id: "54/Tab1 - A->D", value: 4 });
  });

  it("leaves out motions to or from a position not possible on that support", () => {
    const keys = motionOptions(1, "Dos manos bajas", 1).map((m) => m.key);
    expect(keys.some((k) => k.includes("A") || k.includes("B"))).toBe(false);
    expect(keys).toContain("C->D");
  });

  it("has no motions on small tables", () => {
    expect(motionOptions(4, "Dos manos", 1)).toEqual([]);
  });
});

describe("transitions", () => {
  it("reads the 1st base's value as the row and the 2nd's as the column", () => {
    expect(transitionValue(12, 16)).toBe(5); // 9-13 → 16-17
    expect(transitionValue(16, 12)).toBe(4); // 16-17 → 9-13: not symmetric
  });

  it("treats 30 and above as the last range", () => {
    expect(transitionValue(44, 3)).toBe(10);
    expect(transitionValue(30, 30)).toBe(20);
    expect(transitionValue(1, 1)).toBe(1);
  });

  it("rejects values outside the table", () => {
    expect(() => transitionValue(0, 5)).toThrow();
  });
});

describe("edge cases", () => {
  it("needs the category for an id shared by two categories", () => {
    expect(() => baseById("64 A1")).toThrow();
  });

  it("rejects a base value that isn't a positive whole number", () => {
    for (const v of [0, -1, 8.5, Number.NaN]) expect(() => baseGroup(v)).toThrow();
  });

  it("returns nothing for an unknown table or support", () => {
    expect(topPositions(99, "Dos manos", 1)).toEqual([]);
    expect(motionOptions(99, "Otros", 1)).toEqual([]);
    expect(supportOptions(["Dos  manos"])).toEqual([]);
  });

  it("reads transitions at each range boundary", () => {
    expect([
      transitionValue(8, 9),
      transitionValue(9, 8),
      transitionValue(13, 14),
      transitionValue(15, 16),
      transitionValue(29, 30),
      transitionValue(30, 29),
    ]).toEqual([2, 1, 4, 6, 20, 19]);
  });
});

describe("wheels that lack a position", () => {
  it("has no G in Table 6 and no C in Table 7, and no motions to them", () => {
    const keys6 = topPositions(6, "Una mano baja", 1).map((p) => p.key);
    expect(keys6).not.toContain("G");
    expect(motionOptions(6, "Una mano baja", 1).some((m) => m.from === "G" || m.to === "G")).toBe(false);
    expect(topPositions(7, "Una mano baja", 1).map((p) => p.key)).not.toContain("C");
    expect(motionOptions(7, "Una mano baja", 1)).toHaveLength(30);
  });
});

describe("Category 2 middle acting as a top", () => {
  it("offers tables matching the middle's own supports", () => {
    const [, middle] = topSlots(base("59 E10"));
    expect(supportOptions(middle.supports).map((o) => o.table)).toEqual([9]);
  });
});

describe("data consistency", () => {
  it("uses only support names that some top table has", () => {
    const tableSupports = new Set(supportOptions(ALL_SUPPORTS).map((o) => o.support));
    for (const b of todWgBases()) {
      for (const s of [...(b.supports ?? []), ...(b.supportsMiddle ?? [])]) expect(tableSupports).toContain(s);
    }
  });

  it("stores each base's group as baseGroup(value)", () => {
    for (const b of todWgBases()) expect(b.group).toBe(baseGroup(b.value));
  });
});
