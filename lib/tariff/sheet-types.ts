import type { ElementType } from "./catalog/types";

export type ElementColumnId = `col-${number}`;

/** One placed catalog element (fills VALUE + SH + image slots). */
export type PlacedElement = {
  catalogId: string;
  coordinates: string;
  value: number;
  image: string;
  type?: ElementType;
  /** Balance: static hold duration shown in meta row (e.g. 3"). */
  holdDuration?: string;
  /** Dynamic: rotation text in meta row (e.g. 1/4 BACK). */
  rotation?: string;
};

export type ElementColumnLayout = {
  id: ElementColumnId;
  /** 1-based column number (coach-facing) */
  number: number;
};
