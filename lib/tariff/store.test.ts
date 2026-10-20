import { beforeEach, describe, expect, it } from "vitest";
import { emptyCompetitionStep } from "./schema";
import { useWizardStore } from "./store";
import { entry, header, item } from "./test-fixtures";
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
    startSheet(header({ levelSystem: "RFEG" }));
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
});
