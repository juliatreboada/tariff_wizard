import { describe, expect, it } from "vitest";
import { groupCatalogEntriesByRow, parseRowColumnFromCoordinates } from "./coordinates";
import type { CatalogEntry } from "./types";

const entry = (coordinates: string): CatalogEntry => ({
  id: coordinates,
  code: "FIG",
  elementFamily: "balance",
  coordinates,
  image: "x.png",
  value: 0,
  filters: { levelSystems: ["FIG"], categories: ["Cuartetos"], exercises: ["Combined"] },
});

describe("parseRowColumnFromCoordinates", () => {
  it("reads lettered columns (Base, España, FGX)", () => {
    expect(parseRowColumnFromCoordinates("ROW-III B")).toMatchObject({ rowKey: "III", columnKey: "B" });
    expect(parseRowColumnFromCoordinates("ROW-II A-1")).toMatchObject({ rowKey: "II", columnKey: "A" });
    expect(parseRowColumnFromCoordinates("FLEX 3")).toBeNull();
  });

  it("reads numbered boxes (FIG 11-16), with a sub-box or a label", () => {
    expect(parseRowColumnFromCoordinates("ROW-I 4")).toMatchObject({ rowKey: "I", columnKey: "4" });
    expect(parseRowColumnFromCoordinates("ROW-II 3b")).toMatchObject({ rowKey: "II", columnKey: "3b" });
    expect(parseRowColumnFromCoordinates("ROW-I 4 540º/720º")).toMatchObject({ rowKey: "I", columnKey: "4" });
  });

  it("puts Men's Group tops in two rows of ten, as on the official page", () => {
    expect(parseRowColumnFromCoordinates("T5")).toMatchObject({ rowKey: "T1", columnKey: "5" });
    expect(parseRowColumnFromCoordinates("T15")).toMatchObject({ rowKey: "T2", columnKey: "5" });
  });
});

describe("groupCatalogEntriesByRow", () => {
  it("orders boxes numerically and tops after the rows", () => {
    const rows = groupCatalogEntriesByRow(
      ["T18", "T11", "ROW-II 10", "T10", "ROW-II 3b", "ROW-II 3", "T1", "ROW-I 2"].map(entry),
    );
    expect(rows.map((r) => r.rowLabel)).toEqual(["ROW-I", "ROW-II", "T1–T10", "T11–T18"]);
    expect(rows[1].entries.map((e) => e.coordinates)).toEqual(["ROW-II 3", "ROW-II 3b", "ROW-II 10"]);
  });
});
