import type { ValueBreakdown } from "./types";

export function emptyValueBreakdown(): ValueBreakdown {
  return {
    total: 0,
    balance: 0,
    dynamic: 0,
    individual: 0,
  };
}

/** Display like the sheet (one decimal). */
export function formatSheetValue(n: number): string {
  return n.toFixed(1);
}
