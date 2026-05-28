import type { Exercise } from "./enums";
import {
  OFFICIAL_COMBINED_FOOTER,
  OFFICIAL_SHEET_BLOCKS,
  OFFICIAL_MAX_ELEMENT_COLUMNS,
  OFFICIAL_MAX_BLOCK_COUNT,
  type OfficialSheetBlockId,
} from "./official-sheet-layout";
import type { RoutineItem } from "./routine-types";
import type { PlacedElement } from "./sheet-types";

export type SheetColumnSlot =
  | { kind: "empty" }
  | {
      kind: "element";
      routineItemId: string;
      element: PlacedElement;
      elementNumber: number;
    };

export type ComputedBlockLayout = {
  blockId: OfficialSheetBlockId;
  blockIndex: number;
  columns: SheetColumnSlot[];
};

export type ComputedSheetLayout = {
  blocks: ComputedBlockLayout[];
  columnCount: number;
};

const BLOCK_ORDER: OfficialSheetBlockId[] = ["balance", "dynamic", "combined"];

function placeItemsInColumns(
  items: RoutineItem[],
  startNumber: number,
): { columns: SheetColumnSlot[]; nextNumber: number } {
  const columns: SheetColumnSlot[] = [];
  let colIdx = 0;
  let seq = startNumber;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0 && !item.linkedToPrevious) {
      if (colIdx >= OFFICIAL_MAX_ELEMENT_COLUMNS) break;
      columns.push({ kind: "empty" });
      colIdx++;
    }
    if (colIdx >= OFFICIAL_MAX_ELEMENT_COLUMNS) break;
    columns.push({
      kind: "element",
      routineItemId: item.id,
      element: item.element,
      elementNumber: seq++,
    });
    colIdx++;
  }

  return { columns, nextNumber: seq };
}

function padColumns(
  columns: SheetColumnSlot[],
  targetLength: number,
): SheetColumnSlot[] {
  const result = [...columns];
  while (result.length < targetLength) {
    result.push({ kind: "empty" });
  }
  return result.slice(0, targetLength);
}

/** Always three block rows (balance, dynamic, combined). */
export function selectBlocksToShow(): OfficialSheetBlockId[] {
  return BLOCK_ORDER.slice(0, OFFICIAL_MAX_BLOCK_COUNT);
}

export function computeSheetLayout(
  routine: RoutineItem[],
  _exercise: Exercise,
): ComputedSheetLayout {
  const blockIds = selectBlocksToShow();
  const columnCount = OFFICIAL_MAX_ELEMENT_COLUMNS;
  let elementSeq = 1;

  const blocks: ComputedBlockLayout[] = blockIds.map((blockId, blockIndex) => {
    const items = routine.filter((item) => item.block === blockId);
    const { columns, nextNumber } = placeItemsInColumns(items, elementSeq);
    elementSeq = nextNumber;
    return {
      blockId,
      blockIndex,
      columns: padColumns(columns, columnCount),
    };
  });

  return { blocks, columnCount };
}

export function combinedFooterSpans(columnCount: number): [number, number, number] {
  const a = Math.floor(columnCount / 3);
  const b = Math.floor(columnCount / 3);
  const c = columnCount - a - b;
  return [a, b, c];
}

export { OFFICIAL_COMBINED_FOOTER, OFFICIAL_SHEET_BLOCKS };
