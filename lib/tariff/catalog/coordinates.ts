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

const TOPS_PER_ROW = 10;

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

/**
 * Parse coordinates for the picker grid: lettered columns (`ROW-III B`,
 * `ROW-II A-1`), numbered boxes (`ROW-I 4`, `ROW-II 3b`, `ROW-I 4 360º`) and
 * Men's Group tops (`T15`, shown in rows of ten like the official page).
 */
export function parseRowColumnFromCoordinates(
  coordinates: string,
): ParsedRowColumn | null {
  const top = coordinates.match(/^T(\d+)$/);
  if (top) {
    const n = Number(top[1]);
    const line = Math.ceil(n / TOPS_PER_ROW);
    const column = n - (line - 1) * TOPS_PER_ROW;
    return {
      rowKey: `T${line}`,
      rowOrder: 100 + line,
      columnKey: String(column),
      columnOrder: column * 10,
    };
  }
  const box = coordinates.match(/^ROW-([IVX]+)\s+(\d+)([a-z]?)(?:\s.*)?$/i);
  if (box) {
    const rowKey = box[1].toUpperCase();
    return {
      rowKey,
      rowOrder: ROMAN_ROW_ORDER[rowKey] ?? 999,
      columnKey: box[2] + box[3],
      columnOrder: Number(box[2]) * 10 + (box[3] ? box[3].charCodeAt(0) - 96 : 0),
    };
  }
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

/** Grid row label: `ROW-II`, or the tops it holds (`T11–T18`). */
function rowLabelOf(rowKey: string, entries: CatalogEntry[]): string {
  if (!/^T\d+$/.test(rowKey)) return `ROW-${rowKey}`;
  const numbers = entries.map((e) => Number(e.coordinates.slice(1)));
  return `T${Math.min(...numbers)}–T${Math.max(...numbers)}`;
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
      rowLabel: rowLabelOf(rowKey, rowEntries),
      entries: rowEntries,
    }));
}
