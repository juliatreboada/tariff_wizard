import type { OfficialSheetBlockId } from "./official-sheet-layout";
import type { PlacedElement } from "./sheet-types";

/** One element in coach-defined routine order. */
export type RoutineItem = {
  id: string;
  block: OfficialSheetBlockId;
  /** No blank column before this item (adjacent to previous). */
  linkedToPrevious: boolean;
  element: PlacedElement;
};
