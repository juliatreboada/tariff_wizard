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
  /** Extra element performed with this one (Cuartetos ROW III on a pyramid): one cell, values added. */
  addOn?: PlacedElement;
  /**
   * TOD WG pyramid (`element` is its base): the coach's choices only; values
   * are read from the TOD WG data each time (lib/tariff/tod-wg/pyramid.ts).
   */
  todWg?: TodWgPick;
};

/** One top on a TOD WG base: a support table, one of its supports, and a position. */
export type TodWgTopPick = {
  /** "middle": Category 2's middle acting as a top. */
  slot: "top" | "middle";
  table: number;
  support: string;
  /** Wheel letter ("C") or box number ("10"). */
  position: string;
  /** Option letter for a box with several drawings. */
  option?: string;
};

export type TodWgPick = {
  tops: TodWgTopPick[];
  /** A motion of the top's wheel ("A->D"), on the top's support. */
  motion?: string;
  /** Legs together: +1. */
  legsTogether?: boolean;
};
