import { beforeEach, describe, expect, it } from "vitest";
import { getCatalogEntries } from "../catalog/load-catalog";
import type { CatalogEntry } from "../catalog/types";
import { useWizardStore } from "../store";
import { entry, header } from "../test-fixtures";

/** ESCOLAR sheets may take their optional from the RFEG Base tables. */
const rfeg = (id: string): CatalogEntry => {
  const found = getCatalogEntries("RFEG").find((e) => e.id === `rfeg-base-${id}` || e.id === `rfeg-base-${id}` + "-a");
  if (!found) throw new Error(`No RFEG entry ${id}`);
  return found;
};
const store = () => useWizardStore.getState();
const roles = () => store().routine.map((i) => [i.element.catalogId, i.role]);

beforeEach(() => {
  localStorage.clear();
  useWizardStore.setState({ header: header(), routine: [], currentSheetId: "s", savedSheets: [] });
});

describe("ESCOLAR optionals from Base tables", () => {
  it("makes a Base element optional, even with a higher value", () => {
    expect(store().addRoutineElement(entry("fgx-balance-row-i-a"))).toBe(true); // 0
    expect(store().addRoutineElement(rfeg("cadete-pairs-balance-row-i-d"))).toBe(true); // 0.3
    expect(roles()).toEqual([
      ["fgx-balance-row-i-a", "compulsory"],
      ["rfeg-base-cadete-pairs-balance-row-i-d", "optional"],
    ]);
    expect(store().valueBreakdown.balance).toBe(0);
  });

  it("offers every Base age group, but only the sheet's category", () => {
    expect(store().addRoutineElement(rfeg("alevin-pairs-dynamic-row-i-b"))).toBe(true);
    expect(store().addRoutineElement(rfeg("infantil-trios-balance-row-i-b"))).toBe(false);
  });

  it("keeps one optional slot: a second Base element or a third element is refused", () => {
    store().addRoutineElement(rfeg("infantil-pairs-balance-row-i-a"));
    expect(store().addRoutineElement(rfeg("cadete-pairs-balance-row-i-a"))).toBe(false);
    expect(store().addRoutineElement(entry("fgx-balance-row-i-b"))).toBe(true);
    expect(store().addRoutineElement(entry("fgx-balance-row-i-c"))).toBe(false);
  });

  it("still picks the higher of two FGX elements as compulsory", () => {
    store().addRoutineElement(entry("fgx-balance-row-i-b"));
    store().addRoutineElement(entry("fgx-balance-row-i-d"));
    expect(roles()).toEqual([
      ["fgx-balance-row-i-b", "optional"],
      ["fgx-balance-row-i-d", "compulsory"],
    ]);
  });
});

describe("after the category changes", () => {
  // Both elements are Parejas-only: on a Tríos sheet neither is from its own table.
  it("keeps leftover elements optional, adding no difficulty", () => {
    useWizardStore.setState({ competition: { ...store().competition, ...header() } });
    store().addRoutineElement(entry("fgx-balance-row-i-a")); // 0
    store().addRoutineElement(rfeg("infantil-pairs-balance-row-i-b")); // 0.1, Parejas only
    useWizardStore.setState({
      competition: { ...store().competition, category: "Tríos" },
      teamContact: { ...store().teamContact, topName: "Top", baseNames: ["B1", "B2"] },
    });
    store().commitHeader();
    expect(roles()).toEqual([
      ["fgx-balance-row-i-a", "optional"],
      ["rfeg-base-infantil-pairs-balance-row-i-b-a", "optional"], // a cell with options: its first
    ]);
    expect(store().valueBreakdown.balance).toBe(0);
  });
});
