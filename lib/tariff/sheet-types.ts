import type { BalanceSubtype } from "./catalog/types";

export type ElementColumnId = `col-${number}`;

/** One placed balance element (fills VALUE + SH + image slots). */
export type PlacedElement = {
  catalogId: string;
  galicianCode: string;
  value: number;
  image: string;
  subtype: BalanceSubtype;
  label: string;
  /** Balance: static hold duration shown in meta row (e.g. 3"). */
  holdDuration?: string;
  /** Dynamic: rotation / direction text in meta row (e.g. 1/4 BACK). */
  dynamicNotation?: string;
};

export type ElementColumnLayout = {
  id: ElementColumnId;
  /** 1-based column number (coach-facing) */
  number: number;
};
