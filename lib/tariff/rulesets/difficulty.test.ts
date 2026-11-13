import { describe, expect, it } from "vitest";
import { header } from "../test-fixtures";
import { sheetDifficulty } from "./difficulty";

const stored = (total: number) => ({ balance: total, dynamic: 0, individual: 0, total });

describe("sheetDifficulty", () => {
  it("keeps D-SCORE = DV for ESCOLAR, Base Alevín and Cto. España", () => {
    expect(sheetDifficulty(header(), [], stored(0.7)).dScore).toBe(0.7);
    expect(sheetDifficulty(header({ levelSystem: "Base", levelAge: "Alevín" }), [], stored(0.4)).dScore).toBe(0.4);
    expect(sheetDifficulty(header({ levelSystem: "RFEG", levelAge: "Cadete", category: "Tríos" }), [], stored(0.9)).dScore).toBe(0.9);
  });

  it("keeps D-SCORE = DV / 100 for Base Junior", () => {
    expect(sheetDifficulty(header({ levelSystem: "Base", levelAge: "Junior" }), [], stored(25)).dScore).toBe(0.25);
  });

  it("caps D-SCORE at 0.5 in FIG Pre-Youth, not in RFEG Juvenil", () => {
    const py = header({ levelSystem: "FIG", levelAge: "Pre-Youth", category: "Tríos", exercise: "Balance" });
    const juv = header({ levelSystem: "RFEG", levelAge: "Juvenil", category: "Tríos", exercise: "Balance" });
    expect(sheetDifficulty(py, [], stored(0.7))).toEqual({ breakdown: stored(0.7), dScore: 0.5 });
    expect(sheetDifficulty(juv, [], stored(0.7)).dScore).toBe(0.7);
  });

  it("computes free composition from the routine (empty: 0)", () => {
    const senior = header({ levelSystem: "FIG", levelAge: "Senior", exercise: "Balance" });
    expect(sheetDifficulty(senior, [], stored(99))).toEqual({
      breakdown: { balance: 0, dynamic: 0, individual: 0, total: 0 },
      dScore: 0,
    });
  });
});
