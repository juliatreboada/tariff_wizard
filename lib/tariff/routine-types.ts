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

/**
 * What a top does between two static holds: holds a valued position during
 * the transition, holds a position of no value (only with a transition, Art.
 * 18.4 exception), or makes a motion to its new position.
 */
export type TodWgTopMove = "motion" | "held" | "no-value";

/** One static hold of a TOD WG pyramid. */
export type TodWgPick = {
  tops: TodWgTopPick[];
  /** 3" (valued, default) or 1" (only shown: announces the motion that follows). */
  hold?: 1 | 3;
  /** Legs together: +1. */
  legsTogether?: boolean;
  /**
   * The next static hold of the pyramid right before it in the routine: the
   * cell between them holds the bases' transition (if they change) and what
   * each top does (`moves`).
   */
  from?: { transition: boolean; moves: { slot: "top" | "middle"; how: TodWgTopMove }[] };
};
