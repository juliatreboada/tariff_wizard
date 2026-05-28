import type { OfficialSheetBlockId } from "./official-sheet-layout";
import type { PlacedElement } from "./sheet-types";

export type RoutineElementRole = "compulsory" | "optional" | "individual";
export type RoutineGymnastRole = "top" | "base";

/** One element in coach-defined routine order. */
export type RoutineItem = {
  id: string;
  block: OfficialSheetBlockId;
  /** No blank column before this item (adjacent to previous). */
  linkedToPrevious: boolean;
  role?: RoutineElementRole;
  gymnastRole?: RoutineGymnastRole;
  /** Which base when team has multiple bases (0-based). */
  baseIndex?: number;
  /** Items performed together share one TS cell and one routine row. */
  individualGroupId?: string;
  /** @deprecated Use individual sets (groupId) instead of order. */
  individualOrder?: 1 | 2 | 3;
  element: PlacedElement;
};
