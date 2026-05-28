import type { CatalogEntry } from "./types";

const ROMAN_ROW_ORDER: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
};

const COLUMN_ORDER: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
};

export type ParsedRowColumn = {
  rowKey: string;
  rowOrder: number;
  columnKey: string;
  columnOrder: number;
};

/**
 * Grid / table coordinates for display and SH row (e.g. "ROW-I A", "FLEX 3").
 * Internal file codes use hyphens: ROW-I-A, FLEX-3.
 */
export function codeToCoordinates(code: string): string {
  const rowMatch = code.match(/^ROW-([IVX]+)-([A-E])(?:-(\d+))?$/i);
  if (rowMatch) {
    const [, row, col, variant] = rowMatch;
    return variant ? `ROW-${row} ${col}-${variant}` : `ROW-${row} ${col}`;
  }

  const lastDash = code.lastIndexOf("-");
  if (lastDash > 0 && /^\d+$/.test(code.slice(lastDash + 1))) {
    return `${code.slice(0, lastDash)} ${code.slice(lastDash + 1)}`;
  }

  return code;
}

/** Parse `ROW-III B` / `ROW-II A-1` style coordinates for picker grid layout. */
export function parseRowColumnFromCoordinates(
  coordinates: string,
): ParsedRowColumn | null {
  const m = coordinates.match(/^ROW-([IVX]+)\s+([A-E])(?:-(\d+))?$/i);
  if (!m) return null;
  const rowKey = m[1].toUpperCase();
  const columnKey = m[2].toUpperCase();
  const variant = m[3] ? Number(m[3]) : 0;
  return {
    rowKey,
    rowOrder: ROMAN_ROW_ORDER[rowKey] ?? 999,
    columnKey,
    columnOrder: (COLUMN_ORDER[columnKey] ?? 99) * 10 + variant,
  };
}

export type CatalogEntriesByRow = {
  rowKey: string;
  rowLabel: string;
  entries: CatalogEntry[];
};

/** Group balance/dynamic catalog entries by ROW I, II, III… (columns left→right). */
export function groupCatalogEntriesByRow(
  entries: CatalogEntry[],
): CatalogEntriesByRow[] {
  const byRow = new Map<string, CatalogEntry[]>();
  const rowOrder = new Map<string, number>();

  for (const entry of entries) {
    const parsed = parseRowColumnFromCoordinates(entry.coordinates);
    const rowKey = parsed?.rowKey ?? "?";
    if (!byRow.has(rowKey)) {
      byRow.set(rowKey, []);
      rowOrder.set(rowKey, parsed?.rowOrder ?? 999);
    }
    byRow.get(rowKey)!.push(entry);
  }

  for (const rowEntries of byRow.values()) {
    rowEntries.sort((a, b) => {
      const pa = parseRowColumnFromCoordinates(a.coordinates);
      const pb = parseRowColumnFromCoordinates(b.coordinates);
      return (pa?.columnOrder ?? 0) - (pb?.columnOrder ?? 0);
    });
  }

  return [...byRow.entries()]
    .sort((a, b) => (rowOrder.get(a[0]) ?? 0) - (rowOrder.get(b[0]) ?? 0))
    .map(([rowKey, rowEntries]) => ({
      rowKey,
      rowLabel: `ROW-${rowKey}`,
      entries: rowEntries,
    }));
}
