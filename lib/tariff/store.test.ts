import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "./catalog/load-catalog";
import { emptyCompetitionStep } from "./schema";
import { useWizardStore } from "./store";
import { entry, header, item, withoutCatalog } from "./test-fixtures";
import type { StoredHeader } from "./types";

const initialState = useWizardStore.getState();

function startSheet(h: StoredHeader = header()) {
  useWizardStore.setState({
    // A different level in the wizard form: the committed header decides the rules.
    competition: { ...emptyCompetitionStep(), levelSystem: "RFEG" },
    header: h,
    routine: [],
    currentSheetId: "sheet-1",
    savedSheets: [],
  });
}

const store = () => useWizardStore.getState();
const roles = () =>
  store().routine.map((i) => [i.element.catalogId, i.role] as const);

beforeEach(() => {
  localStorage.clear();
  useWizardStore.setState(initialState, true);
  startSheet();
});

describe("ESCOLAR balance and dynamic picks", () => {
  it("accepts two elements from the same row; the higher value is compulsory", () => {
    expect(store().addRoutineElement(entry("fgx-balance-row-i-b"))).toBe(true);
    expect(store().addRoutineElement(entry("fgx-balance-row-i-d"))).toBe(true);
    expect(roles()).toEqual([
      ["fgx-balance-row-i-b", "optional"],
      ["fgx-balance-row-i-d", "compulsory"],
    ]);
  });

  it("makes the newer element optional when it has the lower value", () => {
    store().addRoutineElement(entry("fgx-dynamic-row-i-d"));
    store().addRoutineElement(entry("fgx-dynamic-row-i-b"));
    expect(roles()).toEqual([
      ["fgx-dynamic-row-i-d", "compulsory"],
      ["fgx-dynamic-row-i-b", "optional"],
    ]);
  });

  it("allows at most 2 elements per block", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-a"));
    store().addRoutineElement(entry("fgx-balance-row-i-b"));
    expect(store().addRoutineElement(entry("fgx-balance-row-i-c"))).toBe(false);
    expect(store().addRoutineElement(entry("fgx-dynamic-row-i-c"))).toBe(true);
    expect(store().routine).toHaveLength(3);
  });

  it("rejects the same catalog element twice", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-c"));
    expect(store().addRoutineElement(entry("fgx-balance-row-i-c"))).toBe(false);
  });

  it("counts only compulsory elements in the value breakdown", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-d")); // 0.3
    store().addRoutineElement(entry("fgx-balance-row-i-b")); // 0.1, optional
    store().addRoutineElement(entry("fgx-dynamic-row-i-c")); // 0.2
    const { balance, dynamic, total } = store().valueBreakdown;
    expect(balance).toBeCloseTo(0.3);
    expect(dynamic).toBeCloseTo(0.2);
    expect(total).toBeCloseTo(0.5);
  });

  it("makes the remaining element compulsory after a removal", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-d"));
    store().addRoutineElement(entry("fgx-balance-row-i-b"));
    const compulsory = store().routine.find((i) => i.role === "compulsory")!;
    store().removeRoutineItem(compulsory.id);
    expect(roles()).toEqual([["fgx-balance-row-i-b", "compulsory"]]);
  });

  it("re-derives roles when a replacement changes which value is higher", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-c")); // 0.2
    store().addRoutineElement(entry("fgx-balance-row-i-a")); // 0, optional
    const optional = store().routine.find((i) => i.role === "optional")!;
    expect(
      store().replaceRoutineElement(optional.id, entry("fgx-balance-row-i-e"), {
        role: "compulsory",
      }),
    ).toBe(true);
    expect(roles()).toEqual([
      ["fgx-balance-row-i-c", "optional"],
      ["fgx-balance-row-i-e", "compulsory"],
    ]);
  });

  it("rejects replacing an element with one from another block", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-c"));
    const [only] = store().routine;
    expect(
      store().replaceRoutineElement(only!.id, entry("fgx-dynamic-row-i-c")),
    ).toBe(false);
    expect(store().routine[0]!.element.catalogId).toBe("fgx-balance-row-i-c");
  });
});

describe("ESCOLAR ties", () => {
  // Both value 0: row I A and row II A.
  const a = "fgx-balance-row-i-a";
  const b = "fgx-balance-row-ii-a-1";

  it("makes the newest element optional on a tie", () => {
    store().addRoutineElement(entry(a));
    store().addRoutineElement(entry(b));
    expect(roles()).toEqual([
      [a, "compulsory"],
      [b, "optional"],
    ]);
  });

  it("keeps tied roles after reordering and reloading the saved sheet", () => {
    store().addRoutineElement(entry(a));
    store().addRoutineElement(entry(b));
    store().moveRoutineItem(store().routine[1]!.id, "up");
    expect(roles()).toEqual([
      [b, "optional"],
      [a, "compulsory"],
    ]);
    store().loadSavedSheet("sheet-1");
    expect(roles()).toEqual([
      [b, "optional"],
      [a, "compulsory"],
    ]);
  });
});

describe("ESCOLAR individual sets", () => {
  const pick = (id: string) => [
    { entry: entry(id), gymnastRole: "top" as const },
    { entry: entry(id), gymnastRole: "base" as const, baseIndex: 0 },
  ];

  it("allows at most 3 individual sets", () => {
    expect(store().addIndividualGroup(pick("fgx-individual-eq-1"))).toBe(true);
    expect(store().addIndividualGroup(pick("fgx-individual-eq-2"))).toBe(true);
    expect(store().addIndividualGroup(pick("fgx-individual-eq-3"))).toBe(true);
    expect(store().addIndividualGroup(pick("fgx-individual-eq-4"))).toBe(false);
    expect(store().routine).toHaveLength(6);
  });

  it("removes the whole set when one gymnast's element is removed", () => {
    store().addIndividualGroup(pick("fgx-individual-eq-1"));
    store().removeRoutineItem(store().routine[1]!.id);
    expect(store().routine).toEqual([]);
  });
});

describe("level system source", () => {
  it("applies no ESCOLAR limits or roles for other level systems", () => {
    startSheet(header({ levelSystem: "FIG" }));
    store().addRoutineElement(entry("fgx-balance-row-i-a"));
    store().addRoutineElement(entry("fgx-balance-row-i-b"));
    expect(store().addRoutineElement(entry("fgx-balance-row-i-c"))).toBe(true);
    expect(store().routine.map((i) => i.role)).toEqual([
      "compulsory",
      "compulsory",
      "compulsory",
    ]);
  });

  it("uses the loaded sheet's level, not the wizard form's", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-a"));
    store().addRoutineElement(entry("fgx-balance-row-i-b"));
    // Simulate starting an RFEG sheet, then reopening the ESCOLAR one.
    useWizardStore.setState({
      header: header({ levelSystem: "RFEG" }),
      routine: [],
      currentSheetId: "sheet-2",
    });
    expect(store().competition.levelSystem).toBe("RFEG");
    store().loadSavedSheet("sheet-1");
    expect(store().addRoutineElement(entry("fgx-balance-row-i-c"))).toBe(false);
  });
});

/** A pre-`catalog` element whose entry is gone, so only the FGX default can fill it in. */
function removedEntry() {
  const legacy = withoutCatalog(item("fgx-balance-row-i-b"));
  return { ...legacy, element: { ...legacy.element, catalogId: "fgx-removed" } };
}

describe("persisted data", () => {
  it("assigns ESCOLAR roles to legacy routines on rehydrate", async () => {
    const legacy = [
      item("fgx-balance-row-i-b", { role: undefined }),
      item("fgx-balance-row-i-d", { role: undefined }),
    ];
    localStorage.setItem(
      "tariff-wizard-v1",
      JSON.stringify({
        state: { header: header(), routine: legacy, currentSheetId: "s" },
        version: 0,
      }),
    );
    await useWizardStore.persist.rehydrate();
    expect(roles()).toEqual([
      ["fgx-balance-row-i-b", "optional"],
      ["fgx-balance-row-i-d", "compulsory"],
    ]);
    expect(store().valueBreakdown.balance).toBeCloseTo(0.3);
  });

  it("renames ESCOLAR Absoluto to Absoluta everywhere it was saved", async () => {
    const old = header({ levelAge: "Absoluto" });
    localStorage.setItem(
      "tariff-wizard-v1",
      JSON.stringify({
        state: {
          header: old,
          competition: { ...emptyCompetitionStep(), levelSystem: "Escolar", levelAge: "Absoluto" },
          routine: [],
          savedSheets: [
            { id: "s", updatedAtIso: "2026-10-01T00:00:00.000Z", header: old, routine: [], valueBreakdown: store().valueBreakdown },
          ],
        },
        version: 0,
      }),
    );
    await useWizardStore.persist.rehydrate();
    expect(store().header?.levelAge).toBe("Absoluta");
    expect(store().competition.levelAge).toBe("Absoluta");
    expect(store().savedSheets[0].header.levelAge).toBe("Absoluta");
  });

  it("records the FGX catalog on a legacy routine saved without a header", async () => {
    localStorage.setItem(
      "tariff-wizard-v1",
      JSON.stringify({
        state: { header: null, routine: [removedEntry()] },
        version: 0,
      }),
    );
    await useWizardStore.persist.rehydrate();
    expect(store().routine[0].element.catalog).toBe("FGX");
  });

  it("records the FGX catalog on saved sheets from before it was tracked", () => {
    useWizardStore.setState({
      savedSheets: [
        {
          id: "old",
          updatedAtIso: "2026-10-01T00:00:00.000Z",
          header: header(),
          routine: [removedEntry()],
          valueBreakdown: store().valueBreakdown,
        },
      ],
    });
    store().loadSavedSheet("old");
    expect(store().routine[0].element.catalog).toBe("FGX");
  });
});

describe("TOD WG pyramids", () => {
  const todWgEntry = (id: string) => {
    const found = getCatalogEntries("FIG").find((e) => e.id === id);
    if (!found) throw new Error(`no entry ${id}`);
    return found;
  };
  const seniorTrios = () => header({ levelSystem: "FIG", levelAge: "Senior", category: "Tríos", exercise: "Balance" });
  const topC = { tops: [{ slot: "top" as const, table: 2, support: "Dos manos", position: "C" }] };

  it("saves the coach's choices on the pyramid and counts its whole value", () => {
    startSheet(seniorTrios());
    expect(store().addRoutineElement(todWgEntry("fig-todwg-c1-58-a13"), { block: "balance", todWg: topC })).toBe(true);
    expect(store().routine[0].todWg).toEqual(topC);
    expect(store().valueBreakdown.balance).toBe(4 + 7);
  });

  it("changes the choices when the pyramid is edited", () => {
    startSheet(seniorTrios());
    store().addRoutineElement(todWgEntry("fig-todwg-c1-58-a13"), { block: "balance", todWg: topC });
    const id = store().routine[0].id;
    const withLegs = { ...topC, legsTogether: true };
    expect(store().replaceRoutineElement(id, todWgEntry("fig-todwg-c1-58-a13"), { todWg: withLegs })).toBe(true);
    expect(store().routine[0].todWg).toEqual(withLegs);
    expect(store().valueBreakdown.balance).toBe(4 + 7 + 1);
  });

  it("drops the choices when the element is replaced by a plain one", () => {
    startSheet(seniorTrios());
    store().addRoutineElement(todWgEntry("fig-todwg-c1-58-a13"), { block: "balance", todWg: topC });
    const id = store().routine[0].id;
    store().replaceRoutineElement(id, todWgEntry("fig-todwg-c1-58-a12"));
    expect(store().routine[0].todWg).toBeUndefined();
  });
});

describe("TOD WG continuations", () => {
  const fig = (id: string) => getCatalogEntries("FIG").find((e) => e.id === id)!;
  it("accepts the same base again as the next static hold of its pyramid, but not as a new pyramid", () => {
    startSheet(header({ levelSystem: "FIG", levelAge: "Senior", category: "Tríos", exercise: "Balance" }));
    const base = fig("fig-todwg-c1-58-a13");
    const top = (position: string) => [{ slot: "top" as const, table: 2, support: "Dos manos", position }];
    expect(store().addRoutineElement(base, { block: "balance", todWg: { tops: top("C") } })).toBe(true);
    expect(store().addRoutineElement(base, { block: "balance", todWg: { tops: top("D") } })).toBe(false);
    expect(
      store().addRoutineElement(base, {
        block: "balance",
        todWg: { tops: top("D"), from: { transition: false, moves: [{ slot: "top", how: "motion" }] } },
      }),
    ).toBe(true);
    expect(store().valueBreakdown.balance).toBe(4 + 7 + 4 + 5);
  });
});

describe("TOD WG transitions in the store", () => {
  it("refuses a transition back to a base already in the routine", () => {
    startSheet(header({ levelSystem: "FIG", levelAge: "Senior", category: "Tríos", exercise: "Balance" }));
    const fig = (id: string) => getCatalogEntries("FIG").find((e) => e.id === id)!;
    const top = (position: string) => [{ slot: "top" as const, table: 2, support: "Dos manos", position }];
    const via = (how: "no-value") => ({ transition: true, moves: [{ slot: "top" as const, how }] });
    store().addRoutineElement(fig("fig-todwg-c1-58-a13"), { block: "balance", todWg: { tops: top("C") } });
    expect(store().addRoutineElement(fig("fig-todwg-c1-58-b1"), { block: "balance", todWg: { tops: top("D"), from: via("no-value") } })).toBe(true);
    expect(store().addRoutineElement(fig("fig-todwg-c1-58-a13"), { block: "balance", todWg: { tops: top("C"), from: via("no-value") } })).toBe(false);
  });
});

describe("sheet number format", () => {
  it("shows TOD WG totals with 2 decimals and other levels with 1", async () => {
    const { rulesetFor } = await import("./rulesets");
    expect(rulesetFor({ levelSystem: "FIG", levelAge: "Senior" })?.display.totalsDecimals).toBe(2);
    expect(rulesetFor({ levelSystem: "Escolar", levelAge: "Alevín" })?.display.totalsDecimals ?? 1).toBe(1);
  });
});

describe("TOD WG continuation without transition", () => {
  it("only keeps the base of the hold right before", () => {
    startSheet(header({ levelSystem: "FIG", levelAge: "Senior", category: "Tríos", exercise: "Balance" }));
    const fig = (id: string) => getCatalogEntries("FIG").find((e) => e.id === id)!;
    const top = (position: string) => [{ slot: "top" as const, table: 2, support: "Dos manos", position }];
    store().addRoutineElement(fig("fig-todwg-c1-58-a13"), { block: "balance", todWg: { tops: top("C") } });
    store().addRoutineElement(fig("fig-todwg-c1-58-b1"), {
      block: "balance",
      todWg: { tops: top("D"), from: { transition: true, moves: [{ slot: "top", how: "no-value" }] } },
    });
    // "No transition" but back to 58 A13: not the hold before, so refused.
    expect(
      store().addRoutineElement(fig("fig-todwg-c1-58-a13"), {
        block: "balance",
        todWg: { tops: top("C"), from: { transition: false, moves: [{ slot: "top", how: "motion" }] } },
      }),
    ).toBe(false);
  });
});
