import type { Exercise } from "./enums";
import {
  OFFICIAL_COMBINED_FOOTER,
  OFFICIAL_MAX_BLOCK_COUNT,
  OFFICIAL_MAX_ELEMENT_COLUMNS,
} from "./official-sheet-layout";
import { groupRoutineForDisplay, sortIndividualGroupItems } from "./routine-groups";
import type { OfficialSheetBlockId } from "./official-sheet-layout";
import type { RoutineElementRole, RoutineItem } from "./routine-types";
import type { PlacedElement } from "./sheet-types";

export type SheetColumnSlot =
  | { kind: "empty" }
  | {
      kind: "element";
      routineItemId: string;
      element: PlacedElement;
      elementNumber: number;
      block: OfficialSheetBlockId;
      role?: RoutineElementRole;
    }
  | {
      kind: "individual-group";
      routineItemIds: string[];
      elements: PlacedElement[];
      elementNumber: number;
    };

export type ComputedBlockLayout = {
  blockIndex: number;
  columns: SheetColumnSlot[];
};

/** Routine order flows left→right; overflows into block rows 2 and 3 (9 cols each). */
export type ComputedSheetLayout = {
  blocks: ComputedBlockLayout[];
  columnCount: number;
};

const MAX_TIMELINE_COLUMNS =
  OFFICIAL_MAX_ELEMENT_COLUMNS * OFFICIAL_MAX_BLOCK_COUNT;

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

function placeRoutineInColumns(routine: RoutineItem[]): SheetColumnSlot[] {
  const rows = groupRoutineForDisplay(routine);
  const columns: SheetColumnSlot[] = [];
  let seq = 1;

  for (const row of rows) {
    const linked =
      row.kind === "single"
        ? row.item.linkedToPrevious
        : row.items[0]?.linkedToPrevious ?? false;

    if (columns.length > 0 && row.index > 0 && !linked) {
      if (columns.length >= MAX_TIMELINE_COLUMNS) break;
      columns.push({ kind: "empty" });
    }
    if (columns.length >= MAX_TIMELINE_COLUMNS) break;

    const elementNumber = seq++;

    if (row.kind === "single") {
      columns.push({
        kind: "element",
        routineItemId: row.item.id,
        element: row.item.element,
        elementNumber,
        block: row.item.block,
        role: row.item.role,
      });
    } else {
      columns.push({
        kind: "individual-group",
        routineItemIds: row.items.map((item) => item.id),
        elements: sortIndividualGroupItems(row.items).map((item) => item.element),
        elementNumber,
      });
    }
  }

  return columns;
}

function splitTimelineIntoBlocks(
  timeline: SheetColumnSlot[],
): ComputedBlockLayout[] {
  return Array.from({ length: OFFICIAL_MAX_BLOCK_COUNT }, (_, blockIndex) => {
    const start = blockIndex * OFFICIAL_MAX_ELEMENT_COLUMNS;
    const slice = timeline.slice(start, start + OFFICIAL_MAX_ELEMENT_COLUMNS);
    return {
      blockIndex,
      columns: padColumns(slice, OFFICIAL_MAX_ELEMENT_COLUMNS),
    };
  });
}

export function computeSheetLayout(
  routine: RoutineItem[],
  _exercise: Exercise,
): ComputedSheetLayout {
  const columnCount = OFFICIAL_MAX_ELEMENT_COLUMNS;
  const timeline = placeRoutineInColumns(routine);
  const blocks = splitTimelineIntoBlocks(timeline);
  return { blocks, columnCount };
}

export function combinedFooterSpans(columnCount: number): [number, number, number] {
  const a = Math.floor(columnCount / 3);
  const b = Math.floor(columnCount / 3);
  const c = columnCount - a - b;
  return [a, b, c];
}

export { OFFICIAL_COMBINED_FOOTER };
